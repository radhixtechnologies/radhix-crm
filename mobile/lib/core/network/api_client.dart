import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => message;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String _baseUrl = AppConstants.defaultBaseUrl;
  String? _token;

  String get baseUrl => _baseUrl;
  String? get token => _token;

  VoidCallback? onUnauthorized;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(AppConstants.keyBaseUrl);
    if (customUrl != null && customUrl.isNotEmpty) {
      _baseUrl = customUrl;
    }
    _token = prefs.getString(AppConstants.keyAuthToken);
  }

  Future<void> setBaseUrl(String newUrl) async {
    _baseUrl = newUrl.endsWith('/') ? newUrl.substring(0, newUrl.length - 1) : newUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyBaseUrl, _baseUrl);
  }

  Future<void> resetBaseUrl() async {
    _baseUrl = AppConstants.defaultBaseUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyBaseUrl);
  }

  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString(AppConstants.keyAuthToken, token);
    } else {
      await prefs.remove(AppConstants.keyAuthToken);
    }
  }

  Map<String, String> _getHeaders({Map<String, String>? extraHeaders}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  Uri _buildUri(String path, [Map<String, dynamic>? queryParams]) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final fullUrl = '$_baseUrl$cleanPath';
    final uri = Uri.parse(fullUrl);
    if (queryParams != null && queryParams.isNotEmpty) {
      final stringParams = queryParams.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      )..removeWhere((key, value) => value.isEmpty);
      return uri.replace(queryParameters: stringParams);
    }
    return uri;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? queryParams}) async {
    try {
      final uri = _buildUri(path, queryParams);
      debugPrint('[API GET] $uri');
      final response = await http
          .get(uri, headers: _getHeaders())
          .timeout(AppConstants.connectTimeout);
      return _processResponse(response);
    } on SocketException catch (e) {
      throw ApiException('Cannot connect to server. Please check your internet or server URL.\n(${e.message})');
    } on TimeoutException {
      throw ApiException('Server request timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> post(String path, {dynamic body, Map<String, dynamic>? queryParams}) async {
    try {
      final uri = _buildUri(path, queryParams);
      debugPrint('[API POST] $uri');
      final response = await http
          .post(
            uri,
            headers: _getHeaders(),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConstants.connectTimeout);
      return _processResponse(response);
    } on SocketException catch (e) {
      throw ApiException('Cannot connect to server. Please check your internet or server URL.\n(${e.message})');
    } on TimeoutException {
      throw ApiException('Server request timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> put(String path, {dynamic body}) async {
    try {
      final uri = _buildUri(path);
      debugPrint('[API PUT] $uri');
      final response = await http
          .put(
            uri,
            headers: _getHeaders(),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConstants.connectTimeout);
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Server request timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> patch(String path, {dynamic body}) async {
    try {
      final uri = _buildUri(path);
      debugPrint('[API PATCH] $uri');
      final response = await http
          .patch(
            uri,
            headers: _getHeaders(),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConstants.connectTimeout);
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Server request timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final uri = _buildUri(path);
      debugPrint('[API DELETE] $uri');
      final response = await http
          .delete(uri, headers: _getHeaders())
          .timeout(AppConstants.connectTimeout);
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Server request timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  dynamic _processResponse(http.Response response) {
    dynamic jsonBody;
    try {
      if (response.body.isNotEmpty) {
        jsonBody = jsonDecode(response.body);
      }
    } catch (_) {
      jsonBody = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonBody;
    }

    if (response.statusCode == 401) {
      onUnauthorized?.call();
      final msg = jsonBody is Map ? (jsonBody['message'] ?? 'Session expired. Please login again.') : 'Unauthorized';
      throw ApiException(msg.toString(), statusCode: 401, data: jsonBody);
    }

    String errorMessage = 'Request failed (${response.statusCode})';
    if (jsonBody is Map) {
      if (jsonBody['message'] != null) {
        errorMessage = jsonBody['message'].toString();
      } else if (jsonBody['error'] != null) {
        errorMessage = jsonBody['error'].toString();
      }
    }

    throw ApiException(errorMessage, statusCode: response.statusCode, data: jsonBody);
  }
}
