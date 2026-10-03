import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../../core/network/api_client.dart';
import '../models/user_model.dart';

class AuthService {
  final ApiClient _client = ApiClient();

  Future<UserModel> login(String email, String password) async {
    final response = await _client.post('/auth/login', body: {
      'email': email.trim(),
      'password': password,
    });

    if (response is Map && response['success'] == true) {
      final token = response['token']?.toString();
      if (token != null) {
        await _client.setToken(token);
      }

      final userData = response['data'] ?? response['user'];
      if (userData is Map<String, dynamic>) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyUserData, jsonEncode(userData));
        return UserModel.fromJson(userData);
      }
    }

    throw ApiException(
      response is Map && response['message'] != null
          ? response['message'].toString()
          : 'Login failed. Please check your credentials.',
    );
  }

  Future<UserModel> getMe() async {
    final response = await _client.get('/auth/me');
    if (response is Map && response['success'] == true) {
      final userData = response['data'] ?? response['user'];
      if (userData is Map<String, dynamic>) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyUserData, jsonEncode(userData));
        return UserModel.fromJson(userData);
      }
    }
    throw ApiException('Failed to load user profile');
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    final response = await _client.put('/auth/changepassword', body: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    return response is Map && response['success'] == true;
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _client.put('/auth/updateprofile', body: data);
    if (response is Map && response['success'] == true) {
      final userData = response['data'] ?? response['user'];
      if (userData is Map<String, dynamic>) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.keyUserData, jsonEncode(userData));
        return UserModel.fromJson(userData);
      }
    }
    throw ApiException('Failed to update profile');
  }

  Future<void> logout() async {
    try {
      await _client.post('/auth/logout');
    } catch (_) {
      // Continue local logout
    }
    await _client.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyUserData);
  }
}
