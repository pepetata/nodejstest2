const validateRegistration = (req, res, next) => {
    const { email, password, name } = req.body;
    const errors = [];

    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please provide a valid email address');
    }

    // Password validation
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    // Name validation
    if (!name) {
        errors.push('Name is required');
    } else if (name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateMenuItem = (req, res, next) => {
    const { name, description, price, category } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters long');
    }

    if (!description || description.trim().length < 10) {
        errors.push('Description is required and must be at least 10 characters long');
    }

    if (!price || isNaN(price) || price <= 0) {
        errors.push('Price is required and must be a positive number');
    }

    if (!category || category.trim().length < 2) {
        errors.push('Category is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateOrder = (req, res, next) => {
    const { items, deliveryAddress } = req.body;
    const errors = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('Order must contain at least one item');
    } else {
        items.forEach((item, index) => {
            if (!item.menuItemId) {
                errors.push(`Item ${index + 1}: Menu item ID is required`);
            }
            if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be a positive number`);
            }
        });
    }

    if (!deliveryAddress || deliveryAddress.trim().length < 10) {
        errors.push('Delivery address is required and must be at least 10 characters long');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateMenuItem,
    validateOrder
};
