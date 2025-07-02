const authService = require('../services/authService');

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            await authService.logout(req.user.id);
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
