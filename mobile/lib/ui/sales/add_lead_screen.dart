import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/toast_util.dart';
import '../../providers/sales_provider.dart';
import '../widgets/custom_button.dart';

class AddLeadScreen extends StatefulWidget {
  const AddLeadScreen({super.key});

  @override
  State<AddLeadScreen> createState() => _AddLeadScreenState();
}

class _AddLeadScreenState extends State<AddLeadScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _companyController = TextEditingController();
  final _valueController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedSource = 'website';
  String _selectedTemperature = 'warm';
  bool _isSubmitting = false;

  final List<String> _sources = [
    'website',
    'referral',
    'social-media',
    'email',
    'phone',
    'campaign',
    'other',
  ];

  final List<String> _temperatures = ['cold', 'warm', 'hot'];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _companyController.dispose();
    _valueController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _saveLead() async {
    if (_isSubmitting) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    final sales = context.read<SalesProvider>();

    try {
      final payload = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'company': _companyController.text.trim(),
        'source': _selectedSource,
        'leadTemperature': _selectedTemperature,
        'value': double.tryParse(_valueController.text.trim()) ?? 0.0,
        'currency': 'INR',
        'status': 'new',
      };

      if (_notesController.text.trim().isNotEmpty) {
        payload['notes'] = [
          {'content': _notesController.text.trim()}
        ];
      }

      final success = await sales.createLead(payload);

      if (success && mounted) {
        Navigator.pop(context);
        ToastUtil.showSuccess(null, 'Lead created successfully!');
      } else if (mounted) {
        ToastUtil.showError(
          context,
          sales.errorMessage ?? 'Failed to create lead. Please check connection.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Add New Lead'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Full Name
              const Text(
                'Full Name *',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  hintText: 'e.g. Rahul Sharma',
                  prefixIcon: Icon(Icons.person_outline_rounded),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter lead name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Company Name
              const Text(
                'Company Name',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _companyController,
                decoration: const InputDecoration(
                  hintText: 'e.g. Acme Innovations',
                  prefixIcon: Icon(Icons.business_outlined),
                ),
              ),
              const SizedBox(height: 16),

              // Phone Number
              const Text(
                'Phone Number',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  hintText: '+91 9876543210',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 16),

              // Email
              const Text(
                'Email Address',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'rahul@acme.com',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 16),

              // Deal Value
              const Text(
                'Estimated Deal Value (₹)',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _valueController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: '50000',
                  prefixIcon: Icon(Icons.currency_rupee_rounded),
                ),
              ),
              const SizedBox(height: 16),

              // Lead Source & Temperature Row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Source',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedSource,
                          decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
                          items: _sources.map((src) {
                            return DropdownMenuItem(
                              value: src,
                              child: Text(
                                src[0].toUpperCase() + src.substring(1),
                                style: const TextStyle(fontSize: 13),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedSource = val);
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Temperature',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedTemperature,
                          decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
                          items: _temperatures.map((temp) {
                            return DropdownMenuItem(
                              value: temp,
                              child: Text(
                                temp[0].toUpperCase() + temp.substring(1),
                                style: const TextStyle(fontSize: 13),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedTemperature = val);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Initial Note
              const Text(
                'Initial Notes',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Add initial requirements or meeting details...',
                ),
              ),
              const SizedBox(height: 28),

              // Submit Button
              CustomButton(
                text: 'Create Lead',
                isLoading: _isSubmitting,
                onPressed: _saveLead,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
