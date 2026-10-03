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

  void _saveUrl(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isEmpty) return;

    await context.read<AuthProvider>().setCustomBaseUrl(cleanUrl);
    if (mounted) {
      ToastUtil.showSuccess(context, 'API endpoint updated successfully');
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
            const Text(
              'Specify the backend REST API base URL. Use the quick presets below or enter your custom server URL.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'Base API URL',
                hintText: 'https://radhix-crm.onrender.com/api',
                prefixIcon: Icon(Icons.link_rounded),
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
                  label: const Text('Production (Render)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = AppConstants.defaultBaseUrl;
                  },
                ),
                ActionChip(
                  label: const Text('Android Emulator (10.0.2.2:5000)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = AppConstants.localAndroidBaseUrl;
                  },
                ),
                ActionChip(
                  label: const Text('iOS Localhost (5000)', style: TextStyle(fontSize: 11)),
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
