// Game State
const state = {
    money: 0,
    currentRating: 0,
    currentCustomer: null,
    currentBurger: [],
    isServing: false
};

// Ingredient Definitions
const ingredients = {
    'bun-bottom': { name: 'Bun Bottom', color: '#f0d9a0', price: 1 },
    'lettuce': { name: 'Lettuce', color: '#8bc34a', price: 2 },
    'tomato': { name: 'Tomato', color: '#e53935', price: 2 },
    'cheese': { name: 'Cheese', color: '#fdd835', price: 3 },
    'patty': { name: 'Patty', color: '#795548', price: 5 },
    'bacon': { name: 'Bacon', color: '#d84315', price: 4 },
    'bun-top': { name: 'Bun Top', color: '#f0d9a0', price: 1 }
};

// DOM Elements
const moneyEl = document.getElementById('money');
const ratingEl = document.getElementById('rating');
const customerSlotEl = document.getElementById('customer-slot');
const burgerStackEl = document.getElementById('burger-stack');
const serveBtn = document.getElementById('serve-btn');
const clearBtn = document.getElementById('clear-btn');
const ingredientBtns = document.querySelectorAll('.ingredient');

// Initialize Game
function initGame() {
    generateNewCustomer();
    updateUI();
}

// Generate a new customer with a random order
function generateNewCustomer() {
    const ingredientKeys = Object.keys(ingredients);
    // Ensure burger has bun bottom and top, and at least one patty
    const order = ['bun-bottom', 'patty', 'bun-top'];
    
    // Randomly add optional ingredients
    const optionalIngredients = ['lettuce', 'tomato', 'cheese', 'bacon'];
    optionalIngredients.forEach(ing => {
        if (Math.random() > 0.5) {
            // Insert randomly between bun-bottom and bun-top
            const insertIndex = Math.floor(Math.random() * (order.length - 1)) + 1;
            order.splice(insertIndex, 0, ing);
        }
    });
    
    // Shuffle the optional ingredients position relative to each other, but keep bun/patty fixed? 
    // Papa's Pizzeria keeps the base structure. Let's just keep the order simple:
    // Bun Bottom -> (Random Mix of others) -> Patty -> (Random Mix) -> Bun Top? 
    // Actually, let's just make a random permutation of the selected ingredients excluding bun/patty first?
    // No, standard burger is Bun, Toppings, Patty, Toppings, Bun? Or Bun, Patty, Toppings, Bun?
    // Let's stick to a simple linear list generated above.
    
    state.currentCustomer = { order: order };
    state.currentBurger = [];
    
    // Update Customer UI
    renderCustomer();
    renderBurger();
}

// Render Customer Order
function renderCustomer() {
    if (!state.currentCustomer) return;
    
    const orderHTML = state.currentCustomer.order.map(ing => {
        const name = ingredients[ing].name;
        const price = ingredients[ing].price;
        return `<div>${name} ($${price})</div>`;
    }).join('');
    
    customerSlotEl.innerHTML = `
        <div id="customer-name">${getRandomName()}</div>
        <div id="customer-order">${orderHTML}</div>
    `;
}

// Get a random name for the customer
function getRandomName() {
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn'];
    return names[Math.floor(Math.random() * names.length)];
}

// Add ingredient to burger
function addIngredient(ingredientKey) {
    state.currentBurger.push(ingredientKey);
    renderBurger();
}

// Clear the current burger
function clearBurger() {
    state.currentBurger = [];
    renderBurger();
}

// Serve the burger
function serveBurger() {
    if (state.currentBurger.length === 0) return;
    
    const customerOrder = state.currentCustomer.order;
    const playerBurger = state.currentBurger;
    
    let correct = true;
    let reasons = [];
    
    // Check length
    if (customerOrder.length !== playerBurger.length) {
        correct = false;
        reasons.push("Wrong number of ingredients.");
    } else {
        // Check each ingredient in order
        for (let i = 0; i < customerOrder.length; i++) {
            if (customerOrder[i] !== playerBurger[i]) {
                correct = false;
                reasons.push(`Wrong ingredient at position ${i + 1}.`);
                break; // Just report first mismatch for simplicity
            }
        }
    }
    
    // Calculate Rating
    let rating = 0;
    if (correct) {
        rating = 100;
    } else {
        // Calculate partial credit? Let's say 50% for now if lengths match but wrong order/ing, else 0
        if (customerOrder.length === playerBurger.length) {
            rating = 50;
        } else {
            rating = 0;
        }
    }
    
    // Calculate Money
    // Base price of order
    let orderTotal = customerOrder.reduce((sum, ing) => sum + ingredients[ing].price, 0);
    let tip = 0;
    if (rating === 100) tip = orderTotal * 0.2;
    else if (rating === 50) tip = orderTotal * 0.1;
    
    const earned = orderTotal + tip;
    
    state.money += Math.floor(earned);
    state.currentRating = rating;
    
    alert(`Rating: ${rating}%\nEarned: $${Math.floor(earned)}`);
    
    generateNewCustomer();
    updateUI();
}

// Update UI
function updateUI() {
    moneyEl.textContent = `Money: $${state.money}`;
    ratingEl.textContent = `Rating: ${state.currentRating}%`;
}

// Render Burger Stack
function renderBurger() {
    burgerStackEl.innerHTML = '<div class="plate"></div>'; // Keep plate at bottom
    
    state.currentBurger.forEach(ingKey => {
        const ingData = ingredients[ingKey];
        const div = document.createElement('div');
        div.className = 'ingredient-piece';
        div.style.backgroundColor = ingData.color;
        div.textContent = ingData.name;
        burgerStackEl.appendChild(div);
    });
}

// Event Listeners
ingredientBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const ingredientKey = btn.getAttribute('data-name');
        addIngredient(ingredientKey);
    });
});

clearBtn.addEventListener('click', clearBurger);
serveBtn.addEventListener('click', serveBurger);

// Start Game
initGame();