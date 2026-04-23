/**
 * Burger Bam - Papa's Pizzeria Style Mechanics
 * Features: Time management, customer queue, cooking grill, dynamic tipping.
 */

// --- Configuration ---
const DAY_DURATION = 180; // Seconds (3 minutes)
const CUSTOMER_INTERVAL = 10; // Seconds between new customers
const PATIENCE_DECAY_RATE = 1; // Patience lost per second
const GRILL_COOK_TIME = 10; // Seconds to cook a patty
const BURNT_TIME = 20; // Seconds until a patty burns
const MAX_CUSTOMERS = 5; // Max queue size

// --- State Management ---
const state = {
    money: 0,
    rating: 0,
    totalCustomers: 0,
    servedCustomers: 0,
    dayTime: DAY_DURATION,
    isDayActive: false,
    customers: [], // Array of Customer objects
    currentCustomer: null,
    queueIndex: 0,
    grill: {
        isCooking: false,
        cookTime: 0,
        isBurnt: false,
        patty: null
    },
    assembly: {
        ingredients: [],
        patty: null
    },
    lastCustomerTime: 0
};

// --- Ingredient Definitions ---
const ingredients = {
    'bun-bottom': { name: 'Bun Bottom', cost: 1, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 30 Q 50 60 90 30" fill="#F4D03F" stroke="#E67E22" stroke-width="2"/></svg>` },
    'lettuce': { name: 'Lettuce', cost: 2, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 20 Q 50 40 90 20 L 90 40 Q 50 60 10 40 Z" fill="#8BC34A" stroke="#558B2F" stroke-width="2"/></svg>` },
    'tomato': { name: 'Tomato', cost: 2, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><rect x="10" y="20" width="80" height="20" rx="5" fill="#E53935" stroke="#B71C1C" stroke-width="2"/></svg>` },
    'cheese': { name: 'Cheese', cost: 3, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 5 25 L 100 25 L 90 35 L 10 35 Z" fill="#FFEB3B" stroke="#FBC02D" stroke-width="2"/><path d="M 15 25 L 25 15 L 35 25 Z" fill="#FFEB3B"/><path d="M 65 25 L 75 15 L 85 25 Z" fill="#FFEB3B"/></svg>` },
    'patty': { name: 'Patty', cost: 5, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><ellipse cx="50" cy="30" rx="40" ry="15" fill="#8D6E63" stroke="#5D4037" stroke-width="2"/></svg>` },
    'bacon': { name: 'Bacon', cost: 4, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 20 Q 30 10 50 20 T 90 20 L 90 30 Q 70 40 50 30 T 10 30 Z" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/></svg>` },
    'bun-top': { name: 'Bun Top', cost: 1, svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 30 Q 50 -10 90 30 Z" fill="#F4D03F" stroke="#E67E22" stroke-width="2"/></svg>` }
};

// --- Customer Logic ---
class Customer {
    constructor(id) {
        this.id = id;
        this.name = this.generateName();
        this.order = this.generateOrder();
        this.patience = 100;
        this.waitTime = 0;
        this.isHappy = false;
        this.isAngry = false;
    }

    generateName() {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank'];
        return names[Math.floor(Math.random() * names.length)];
    }

    generateOrder() {
        const possible = ['lettuce', 'tomato', 'cheese', 'bacon'];
        const numToppings = Math.floor(Math.random() * 3) + 1; // 1 to 3 toppings
        const order = new Set();
        while (order.size < numToppings) {
            order.add(possible[Math.floor(Math.random() * possible.length)]);
        }
        return Array.from(order);
    }

    update(dt) {
        this.waitTime += dt;
        // Patience decays faster if they've been waiting a long time
        const decay = this.waitTime > 30 ? PATIENCE_DECAY_RATE * 1.5 : PATIENCE_DECAY_RATE;
        this.patience -= decay;
        if (this.patience <= 0) {
            this.patience = 0;
            this.isAngry = true;
        }
    }
}

// --- Game Functions ---

function initGame() {
    // Setup Event Listeners
    document.getElementById('serve-btn').addEventListener('click', serveBurger);
    document.getElementById('clear-btn').addEventListener('click', clearAssembly);
    document.getElementById('place-patty-btn').addEventListener('click', placePattyOnGrill);
    document.getElementById('remove-patty-btn').addEventListener('click', removePattyFromGrill);

    // Initial Render
    renderQueue();
    renderHUD();
    
    // Start the Game Loop
    state.isDayActive = true;
    state.dayTime = DAY_DURATION;
    state.lastCustomerTime = 0;
    
    // Add first customer immediately
    addNewCustomer();

    // Main Game Loop (1 second intervals)
    setInterval(gameLoop, 1000);
    
    // UI Update Loop (more frequent for smooth timers)
    setInterval(updateUI, 100);
}

function addNewCustomer() {
    if (state.customers.length >= MAX_CUSTOMERS) return;
    
    const newCustomer = new Customer(Date.now());
    state.customers.push(newCustomer);
    state.totalCustomers++;
    
    // If no current customer, make this one current
    if (!state.currentCustomer) {
        state.currentCustomer = state.customers[0];
        state.queueIndex = 1;
    }
    
    renderQueue();
}

function gameLoop() {
    if (!state.isDayActive) return;

    // 1. Decrement Day Timer
    state.dayTime--;
    if (state.dayTime <= 0) {
        endDay();
        return;
    }

    // 2. Update Customers
    state.customers.forEach(c => c.update(1));

    // 3. Check for Angry Customers leaving
    const angryCustomer = state.customers.find(c => c.isAngry && c === state.currentCustomer);
    if (angryCustomer) {
        serveAngryCustomer();
    } else if (state.currentCustomer && state.currentCustomer.isAngry && state.currentCustomer !== state.customers[0]) {
        // If a customer in the queue gets angry, they leave, next steps up
         // Handled in updateUI when currentCustomer changes
    }

    // 4. Spawn New Customers
    state.lastCustomerTime++;
    if (state.lastCustomerTime >= CUSTOMER_INTERVAL) {
        addNewCustomer();
        state.lastCustomerTime = 0;
    }

    // 5. Update Grill
    if (state.grill.isCooking) {
        state.grill.cookTime++;
        if (state.grill.cookTime >= BURNT_TIME) {
            state.grill.isBurnt = true;
        }
    }
}

function updateUI() {
    if (!state.isDayActive) return;

    // Update Day Timer
    document.getElementById('day-timer').textContent = formatTime(state.dayTime);

    // Update Current Customer Patience
    if (state.currentCustomer) {
        const patienceBar = document.getElementById('patience-bar');
        const patienceText = document.getElementById('patience-text');
        const percentage = state.currentCustomer.patience;
        
        patienceBar.style.width = `${percentage}%`;
        patienceText.textContent = `${Math.floor(percentage)}%`;
        
        // Color change based on patience
        if (percentage > 50) {
            patienceBar.style.backgroundColor = '#8BC34A'; // Green
        } else if (percentage > 20) {
            patienceBar.style.backgroundColor = '#FFC107'; // Yellow
        } else {
            patienceBar.style.backgroundColor = '#E53935'; // Red
        }
    }

    // Update Grill Status
    const grillStatus = document.getElementById('grill-status');
    const pattyVisual = document.getElementById('patty-visual');
    
    if (state.grill.isCooking) {
        grillStatus.textContent = `Cooking... ${state.grill.cookTime}s / ${GRILL_COOK_TIME}s`;
        if (state.grill.isBurnt) {
            grillStatus.textContent = "BURNT!";
            grillStatus.style.color = '#E53935';
            pattyVisual.style.fill = '#3E2723';
        } else {
            grillStatus.style.color = '#333';
            const cookProgress = state.grill.cookTime / GRILL_COOK_TIME;
            // Change color from raw to cooked
            const r = Math.floor(141 + (62 - 141) * cookProgress);
            const g = Math.floor(110 + (31 - 110) * cookProgress);
            const b = Math.floor(99 + (55 - 99) * cookProgress);
            pattyVisual.style.fill = `rgb(${r},${g},${b})`;
        }
    } else {
        grillStatus.textContent = "Grill Idle";
        grillStatus.style.color = '#777';
        pattyVisual.style.fill = '#8D6E63';
    }

    // Update Queue
    renderQueue();
}

function renderHUD() {
    document.getElementById('money').textContent = `$${state.money}`;
    document.getElementById('rating').textContent = `${state.rating}%`;
    document.getElementById('day-timer').textContent = formatTime(state.dayTime);
}

function renderQueue() {
    const queueContainer = document.getElementById('customer-queue');
    queueContainer.innerHTML = '';

    // Render Queue (Customers waiting)
    const queue = state.customers.slice(state.queueIndex);
    queue.forEach(customer => {
        const div = document.createElement('div');
        div.className = 'queue-customer';
        div.innerHTML = `
            <div class="customer-avatar">👤</div>
            <div class="customer-name">${customer.name}</div>
            <div class="customer-patience-mini" style="width:${customer.patience}%"></div>
        `;
        queueContainer.appendChild(div);
    });

    // Render Active Customer
    const activeContainer = document.getElementById('active-customer-area');
    if (state.currentCustomer) {
        const c = state.currentCustomer;
        activeContainer.innerHTML = `
            <div class="active-customer">
                <div class="customer-avatar large">👤</div>
                <div class="customer-name large">${c.name}</div>
                <div class="order-bubble">
                    <h3>Order:</h3>
                    <ul>
                        <li>Patty (Cooked)</li>
                        ${c.order.map(i => `<li>${ingredients[i].name}</li>`).join('')}
                    </ul>
                </div>
                <div class="patience-container">
                    <div class="patience-bar-bg">
                        <div id="patience-bar" class="patience-bar" style="width:${c.patience}%"></div>
                    </div>
                    <span id="patience-text">${Math.floor(c.patience)}%</span>
                </div>
            </div>
        `;
    } else {
        activeContainer.innerHTML = '<p>No customers waiting...</p>';
    }
}

// --- Player Actions ---

function placePattyOnGrill() {
    if (state.grill.isCooking) return;
    if (state.assembly.patty) {
        alert("Remove the patty from the assembly station first!");
        return;
    }

    state.grill.isCooking = true;
    state.grill.cookTime = 0;
    state.grill.isBurnt = false;
    state.grill.patty = { status: 'raw' };
    
    clearAssembly(); // Start fresh for the new patty
    renderQueue(); // Update grill UI
}

function removePattyFromGrill() {
    if (!state.grill.isCooking) return;

    state.assembly.patty = { 
        status: state.grill.isBurnt ? 'burnt' : 'cooked',
        cookTime: state.grill.cookTime
    };
    
    state.grill.isCooking = false;
    state.grill.cookTime = 0;
    state.grill.isBurnt = false;
    
    renderQueue();
}

function addIngredient(type) {
    if (state.assembly.ingredients.length >= 4) return; // Max 4 toppings
    state.assembly.ingredients.push(type);
    renderAssemblyStack();
}

function clearAssembly() {
    state.assembly.ingredients = [];
    state.assembly.patty = null;
    if (state.grill.isCooking) {
        // Optional: Keep cooking if we clear assembly? 
        // In Papa's games, usually you can't clear assembly if patty is on grill.
        // But here, patty is on grill until removed. So clearing assembly just removes the *assembled* patty if it was there?
        // No, in my logic: patty is on grill OR in assembly.
        // If I clear assembly, I remove the patty from the stack? 
        // Let's say "Clear" resets the ingredients but keeps the patty if it was already placed?
        // Actually, let's make "Clear" reset the whole station.
        state.grill.isCooking = false;
        state.grill.patty = null;
    }
    renderAssemblyStack();
    renderQueue();
}

function serveBurger() {
    if (!state.currentCustomer) return;
    
    const c = state.currentCustomer;
    
    // Validation
    if (!state.assembly.patty) {
        alert("You need a patty!");
        return;
    }

    // Check Patty Status
    if (state.assembly.patty.status === 'burnt') {
        alert("The patty is burnt! The customer will be angry.");
        // Still serve, but they will be angry anyway
    }

    // Check Ingredients
    const required = c.order;
    const provided = state.assembly.ingredients;
    
    let accuracy = 0;
    let missing = false;
    
    required.forEach(ing => {
        if (provided.includes(ing)) accuracy++;
        else missing = true;
    });

    // Calculate Tip
    let tip = 0;
    const patienceBonus = c.patience / 100;
    
    if (state.assembly.patty.status === 'burnt') {
        tip = 0;
        c.isAngry = true; // Force anger
    } else if (missing) {
        tip = Math.floor(5 * patienceBonus); // Low tip for wrong order
    } else {
        tip = Math.floor(10 + (5 * patienceBonus)); // High tip for perfect order + speed
    }

    // Update State
    state.money += tip;
    state.rating = calculateNewRating(state.rating, tip > 0);
    state.servedCustomers++;
    
    // Feedback
    showServeFeedback(tip, accuracy === required.length);
    
    // Remove Customer
    state.customers.shift();
    state.currentCustomer = state.customers.length > 0 ? state.customers[0] : null;
    state.queueIndex = 0;
    
    // Clear Station
    clearStation();
    
    updateHUD();
    renderQueue();
}

function serveAngryCustomer() {
    state.customers.shift();
    state.currentCustomer = state.customers.length > 0 ? state.customers[0] : null;
    state.queueIndex = 0;
    clearStation();
    renderQueue();
}

function clearStation() {
    state.assembly = { ingredients: [], patty: null };
    state.grill = { isCooking: false, cookTime: 0, isBurnt: false, patty: null };
    renderAssemblyStack();
    renderQueue();
}

function calculateNewRating(current, isGood) {
    // Simple rating logic: Start at 50%, +/- 5%
    let newRating = current + (isGood ? 5 : -5);
    return Math.max(0, Math.min(100, newRating));
}

function showServeFeedback(tip, isPerfect) {
    const feedback = document.getElementById('serve-feedback');
    feedback.className = isPerfect ? 'feedback success' : 'feedback fail';
    feedback.innerHTML = isPerfect 
        ? `<h3>Perfect!</h3><p>+ $${tip}</p>` 
        : `<h3>Not Great</h3><p>+ $${tip}</p>`;
    feedback.style.display = 'block';
    setTimeout(() => { feedback.style.display = 'none'; }, 2000);
}

function endDay() {
    state.isDayActive = false;
    const overlay = document.getElementById('day-end-overlay');
    overlay.style.display = 'flex';
    document.getElementById('final-money').textContent = `$${state.money}`;
    document.getElementById('final-rating').textContent = `${state.rating}%`;
    document.getElementById('final-served').textContent = `${state.servedCustomers}`;
}

function resetDay() {
    state.money = 0;
    state.rating = 50;
    state.servedCustomers = 0;
    state.customers = [];
    state.currentCustomer = null;
    state.dayTime = DAY_DURATION;
    state.isDayActive = true;
    state.grill = { isCooking: false, cookTime: 0, isBurnt: false, patty: null };
    state.assembly = { ingredients: [], patty: null };
    
    document.getElementById('day-end-overlay').style.display = 'none';
    addNewCustomer();
    clearStation();
    renderHUD();
    renderQueue();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Rendering Helpers ---

function renderAssemblyStack() {
    const stack = document.getElementById('assembly-stack');
    stack.innerHTML = '';
    
    // Render Patty
    if (state.assembly.patty) {
        const pattyDiv = document.createElement('div');
        pattyDiv.className = 'stack-item patty';
        const color = state.assembly.patty.status === 'burnt' ? '#3E2723' : '#8D6E63';
        pattyDiv.innerHTML = `<svg viewBox="0 0 100 60" width="100%" height="100%"><ellipse cx="50" cy="30" rx="40" ry="15" fill="${color}" stroke="#5D4037" stroke-width="2"/></svg>`;
        stack.appendChild(pattyDiv);
    }

    // Render Ingredients
    state.assembly.ingredients.forEach(ing => {
        const div = document.createElement('div');
        div.className = 'stack-item';
        div.innerHTML = ingredients[ing].svg;
        stack.appendChild(div);
    });
}

// Initialize
initGame();