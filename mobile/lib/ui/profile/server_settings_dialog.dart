import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/toast_util.dart';
import '../../providers/auth_provider.dart';

class ServerSettingsDialog extends StatefulWidget {
  const ServerSettingsDialog({super.key});

  @override
  State<ServerSettingsDialog> createState() => _ServerSettingsDialogState();
}

class _ServerSettingsDialogState extends State<ServerSettingsDialog> {
  final TextEditingController _urlController = TextEditingController();
  bool _isTesting = false;

  @override
  void initState() {
    super.initState();
    _urlController.text = ApiClient().baseUrl;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _testConnection() async {
    final cleanUrl = _urlController.text.trim();
    if (cleanUrl.isEmpty) {
      ToastUtil.showError(context, 'Please enter a valid URL');
      return;
    }

    setState(() => _isTesting = true);
    final result = await ApiClient().testConnection(cleanUrl);
    if (!mounted) return;
    setState(() => _isTesting = false);

    if (result['success'] == true) {
      ToastUtil.showSuccess(context, result['message'] ?? 'Connected successfully!');
    } else {
      ToastUtil.showError(context, result['message'] ?? 'Connection test failed');
    }
  }

  void _saveUrl(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;

    await context.read<AuthProvider>().setCustomBaseUrl(cleanUrl);
    if (mounted) {
      ToastUtil.showSuccess(context, 'API endpoint updated to $cleanUrl');
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.dns_rounded, color: AppColors.primary, size: 22),
          SizedBox(width: 8),
          Text(
            'Server API Endpoint',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.phone_android_rounded, size: 18, color: AppColors.primary),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Real Device (Moto Edge 60 Fusion): Ensure phone and laptop are on the same Wi-Fi. Use your laptop\'s IP (e.g. http://192.168.1.X:5000/api). Do not use localhost or 10.0.2.2.',
                      style: TextStyle(fontSize: 11, color: AppColors.textPrimary, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _urlController,
              decoration: InputDecoration(
                labelText: 'Base API URL',
                hintText: 'https://radhix-crm.onrender.com/api',
                prefixIcon: const Icon(Icons.link_rounded),
                suffixIcon: IconButton(
                  tooltip: 'Reset to Default',
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  onPressed: () {
                    _urlController.text = AppConstants.defaultBaseUrl;
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _isTesting ? null : _testConnection,
                icon: _isTesting
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.network_check_rounded, size: 16),
                label: Text(
                  _isTesting ? 'Testing Connectivity...' : 'Test Connection',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Quick Presets:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  label: const Text('Production (Render Cloud)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = AppConstants.defaultBaseUrl;
                  },
                ),
                ActionChip(
                  label: const Text('Real Phone (Enter Local IP)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = 'http://192.168.1.100:5000/api';
                    _urlController.selection = TextSelection(
                      baseOffset: 7,
                      extentOffset: _urlController.text.length - 9,
                    );
                  },
                ),
                ActionChip(
                  label: const Text('Android Emulator (10.0.2.2:5000)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = AppConstants.localAndroidBaseUrl;
                  },
                ),
                ActionChip(
                  label: const Text('iOS Simulator (localhost:5000)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = AppConstants.localIosBaseUrl;
                  },
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => _saveUrl(_urlController.text),
          child: const Text('Save & Apply'),
        ),
      ],
    );
  }
}

