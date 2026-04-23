// Game State
const state = {
    money: 0,
    rating: 0,
    currentCustomer: null,
    currentBurger: [],
    isServing: false
};

// Ingredient Definitions with SVG Graphics
const ingredients = {
    'bun-bottom': { 
        name: 'Bun Bottom', 
        price: 1, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 30 Q 50 60 90 30" fill="#F4D03F" stroke="#E67E22" stroke-width="2"/></svg>` 
    },
    'lettuce': { 
        name: 'Lettuce', 
        price: 2, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 20 Q 50 40 90 20 L 90 40 Q 50 60 10 40 Z" fill="#8BC34A" stroke="#558B2F" stroke-width="2"/></svg>` 
    },
    'tomato': { 
        name: 'Tomato', 
        price: 2, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><rect x="10" y="20" width="80" height="20" rx="5" fill="#E53935" stroke="#B71C1C" stroke-width="2"/></svg>` 
    },
    'cheese': { 
        name: 'Cheese', 
        price: 3, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 5 25 L 100 25 L 90 35 L 10 35 Z" fill="#FFEB3B" stroke="#FBC02D" stroke-width="2"/><path d="M 15 25 L 25 15 L 35 25 Z" fill="#FFEB3B"/><path d="M 65 25 L 75 15 L 85 25 Z" fill="#FFEB3B"/></svg>` 
    },
    'patty': { 
        name: 'Patty', 
        price: 5, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><ellipse cx="50" cy="30" rx="45" ry="15" fill="#795548" stroke="#3E2723" stroke-width="2"/></svg>` 
    },
    'bacon': { 
        name: 'Bacon', 
        price: 4, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 25 Q 25 15 40 25 T 70 25 T 100 25 L 100 35 Q 85 25 70 35 T 40 35 T 10 35 Z" fill="#D84315" stroke="#BF360C" stroke-width="2"/></svg>` 
    },
    'bun-top': { 
        name: 'Bun Top', 
        price: 1, 
        svg: `<svg viewBox="0 0 100 60" width="100%" height="100%"><path d="M 10 30 Q 50 -10 90 30 Z" fill="#F4D03F" stroke="#E67E22" stroke-width="2"/></svg>` 
    }
};

// DOM Elements
const moneyEl = document.getElementById('money');
const ratingEl = document.getElementById('rating');
const orderListEl = document.getElementById('order-list');
const burgerStackEl = document.getElementById('burger-stack');
const serveBtn = document.getElementById('serve-btn');
const clearBtn = document.getElementById('clear-btn');
const ingredientBtns = document.querySelectorAll('.ingredient');

// Initialize Game
function initGame() {
    updateHUD();
    generateCustomer();
    
    ingredientBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const ingredientKey = btn.getAttribute('data-name');
            addIngredient(ingredientKey);
        });
    });

    clearBtn.addEventListener('click', clearBurger);
    serveBtn.addEventListener('click', serveBurger);
}

// Generate a new Customer and Order
function generateCustomer() {
    const keys = Object.keys(ingredients);
    const order = [];
    
    // Determine number of ingredients (3 to 6)
    const numIngredients = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < numIngredients; i++) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        order.push(randomKey);
    }

    state.currentCustomer = {
        order: order
    };

    renderOrder();
}

// Render the Order Bubble
function renderOrder() {
    orderListEl.innerHTML = '';
    if (!state.currentCustomer) return;

    state.currentCustomer.order.forEach(key => {
        const item = document.createElement('div');
        item.className = 'order-item';
        item.textContent = ingredients[key].name;
        orderListEl.appendChild(item);
    });
}

// Add Ingredient to Burger
function addIngredient(key) {
    if (state.isServing) return;
    
    state.currentBurger.push(key);
    renderBurgerStack();
}

// Render the Burger Stack
function renderBurgerStack() {
    burgerStackEl.innerHTML = '';
    
    state.currentBurger.forEach(key => {
        const item = document.createElement('div');
        item.className = 'stack-item';
        item.innerHTML = ingredients[key].svg;
        burgerStackEl.appendChild(item);
    });
}

// Clear Current Burger
function clearBurger() {
    state.currentBurger = [];
    renderBurgerStack();
}

// Serve Burger
function serveBurger() {
    if (state.isServing) return;
    state.isServing = true;

    const customerOrder = state.currentCustomer.order;
    const playerBurger = state.currentBurger;

    // Calculate Score
    let matches = 0;
    const maxLen = Math.max(customerOrder.length, playerBurger.length);
    
    for (let i = 0; i < maxLen; i++) {
        if (customerOrder[i] === playerBurger[i]) {
            matches++;
        }
    }
    
    const percentage = Math.round((matches / maxLen) * 100);
    
    // Calculate Money
    const burgerCost = playerBurger.reduce((sum, key) => sum + ingredients[key].price, 0);
    let tip = 0;
    if (percentage === 100) tip = 10;
    else if (percentage >= 80) tip = 5;
    else if (percentage >= 50) tip = 2;

    const totalEarned = burgerCost + tip;
    state.money += totalEarned;
    state.rating = percentage;

    // Visual Feedback
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.background = 'rgba(0,0,0,0.8)';
    feedback.style.color = 'white';
    feedback.style.padding = '20px 40px';
    feedback.style.borderRadius = '10px';
    feedback.style.fontSize = '24px';
    feedback.style.fontFamily = 'Fredoka One, cursive';
    feedback.style.zIndex = '1000';
    feedback.textContent = `Served! +$${totalEarned} (${percentage}%)`;
    document.body.appendChild(feedback);

    setTimeout(() => {
        document.body.removeChild(feedback);
        state.isServing = false;
        clearBurger();
        generateCustomer();
        updateHUD();
    }, 1500);
}

// Update HUD
function updateHUD() {
    moneyEl.textContent = `$${state.money}`;
    ratingEl.textContent = `${state.rating}%`;
}

// Start Game
initGame();