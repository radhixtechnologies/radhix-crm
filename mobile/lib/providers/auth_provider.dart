import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../data/models/user_model.dart';
import '../data/services/auth_service.dart';

enum AuthStatus { initial, authenticating, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiClient _apiClient = ApiClient();

  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _errorMessage;
  String? _savedEmail;
  bool _rememberMe = false;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  String? get savedEmail => _savedEmail;
  bool get rememberMe => _rememberMe;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _user != null;

  AuthProvider() {
    _apiClient.onUnauthorized = () {
      logout();
    };
  }

  Future<void> checkAuth() async {
    _status = AuthStatus.authenticating;
    notifyListeners();

    try {
      await _apiClient.init();
      final prefs = await SharedPreferences.getInstance();
      _savedEmail = prefs.getString(AppConstants.keyRememberEmail);
      _rememberMe = prefs.getBool(AppConstants.keyRememberMe) ?? false;

      final token = prefs.getString(AppConstants.keyAuthToken);
      final rawUserData = prefs.getString(AppConstants.keyUserData);

      if (token != null && token.isNotEmpty && rawUserData != null) {
        try {
          _user = UserModel.fromJson(jsonDecode(rawUserData));
          _status = AuthStatus.authenticated;
          notifyListeners();

          // Refresh profile in background
          _authService.getMe().then((freshUser) {
            _user = freshUser;
            notifyListeners();
          }).catchError((_) {});
          return;
        } catch (_) {}
      }

      _status = AuthStatus.unauthenticated;
    } catch (e) {
      _status = AuthStatus.unauthenticated;
    } finally {
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password, {bool remember = false}) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.login(email, password);
      _user = user;
      _status = AuthStatus.authenticated;

      final prefs = await SharedPreferences.getInstance();
      _rememberMe = remember;
      await prefs.setBool(AppConstants.keyRememberMe, remember);
      if (remember) {
        _savedEmail = email;
        await prefs.setString(AppConstants.keyRememberEmail, email);
      } else {
        _savedEmail = null;
        await prefs.remove(AppConstants.keyRememberEmail);
      }

      notifyListeners();
      return true;
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      return await _authService.changePassword(currentPassword, newPassword);
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> setCustomBaseUrl(String url) async {
    await _apiClient.setBaseUrl(url);
    notifyListeners();
  }

  Future<void> resetBaseUrl() async {
    await _apiClient.resetBaseUrl();
    notifyListeners();
  }
}
