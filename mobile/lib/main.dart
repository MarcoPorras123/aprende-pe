import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'api.dart';
import 'home.dart';
import 'ui.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(AprendeApp(api: LearningApi()));
}

class AprendeApp extends StatelessWidget {
  const AprendeApp({super.key, required this.api});
  final LearningApi api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aprende Pe!',
      debugShowCheckedModeBanner: false,
      locale: const Locale('es'),
      supportedLocales: const [Locale('es')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: appTheme(),
      builder: (context, child) => ColoredBox(
        color: const Color(0xffdfe6df),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: child!,
          ),
        ),
      ),
      home: HomeScreen(api: api),
    );
  }
}
