const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  sendSuccess(res, null, 200, 'Logged out successfully');
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result, 200, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, refresh, getMe };
