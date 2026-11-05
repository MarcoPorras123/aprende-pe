import 'package:flutter/material.dart';

const ink = Color(0xff1c302c),
    green = Color(0xff245c48),
    sage = Color(0xffe9f0e6),
    paper = Color(0xfff7f8f3),
    muted = Color(0xff65736b),
    lavender = Color(0xffece7f5),
    peach = Color(0xfff8ebde),
    mint = Color(0xffe0eee7);
ThemeData appTheme() => ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: paper,
  colorScheme: ColorScheme.fromSeed(
    seedColor: green,
    primary: green,
    surface: paper,
    onSurface: ink,
  ),
  textTheme: const TextTheme(
    headlineLarge: TextStyle(
      fontSize: 34,
      height: 1.16,
      fontWeight: FontWeight.w700,
      letterSpacing: -1.2,
      color: ink,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      height: 1.2,
      fontWeight: FontWeight.w700,
      letterSpacing: -.8,
      color: ink,
    ),
    titleLarge: TextStyle(
      fontSize: 21,
      fontWeight: FontWeight.w700,
      letterSpacing: -.4,
    ),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    bodyLarge: TextStyle(fontSize: 16, height: 1.5),
    bodyMedium: TextStyle(fontSize: 14, height: 1.5),
    bodySmall: TextStyle(fontSize: 12, height: 1.5, color: muted),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: paper,
    surfaceTintColor: Colors.transparent,
    centerTitle: false,
    titleTextStyle: TextStyle(
      fontSize: 17,
      fontWeight: FontWeight.w600,
      color: ink,
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      minimumSize: const Size(48, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)),
      textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      minimumSize: const Size(48, 50),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(17)),
      side: const BorderSide(color: Color(0xffcbd7ca)),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.all(18),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: Color(0xffdce2d8)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: Color(0xffdce2d8)),
    ),
  ),
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: Colors.white,
    surfaceTintColor: Colors.transparent,
    indicatorColor: sage,
    labelTextStyle: WidgetStateProperty.all(
      const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
    ),
  ),
  dividerTheme: const DividerThemeData(color: Color(0xffe2e7dd)),
);

class SheetCard extends StatelessWidget {
  const SheetCard({
    super.key,
    required this.child,
    this.color = Colors.white,
    this.padding = 20,
    this.onTap,
  });
  final Widget child;
  final Color color;
  final double padding;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: color,
    borderRadius: BorderRadius.circular(24),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Padding(padding: EdgeInsets.all(padding), child: child),
    ),
  );
}

class StudyBadge extends StatelessWidget {
  const StudyBadge(
    this.text, {
    super.key,
    this.color = sage,
    this.foreground = green,
    this.icon,
  });
  final String text;
  final Color color, foreground;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(30),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 14, color: foreground),
          const SizedBox(width: 5),
        ],
        Flexible(
          child: Text(
            text,
            style: TextStyle(
              color: foreground,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.trailing});
  final String title;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 28, bottom: 14),
    child: Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        ?trailing,
      ],
    ),
  );
}

class ErrorNote extends StatelessWidget {
  const ErrorNote(this.message, {super.key, this.retry});
  final String message;
  final VoidCallback? retry;
  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: SheetCard(
        color: const Color(0xffffeee5),
        padding: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.info_outline,
                  size: 20,
                  color: Color(0xff8a4725),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    message,
                    style: const TextStyle(color: Color(0xff713b20)),
                  ),
                ),
              ],
            ),
            if (retry != null)
              TextButton(
                onPressed: retry,
                child: const Text('Volver a intentar'),
              ),
          ],
        ),
      ),
    ),
  );
}

class PrimaryAction extends StatelessWidget {
  const PrimaryAction(
    this.label, {
    super.key,
    required this.onPressed,
    this.busy = false,
    this.icon = Icons.arrow_forward_rounded,
  });
  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  final IconData icon;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: FilledButton(
      onPressed: busy ? null : onPressed,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (busy) ...[
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 10),
            ],
            Flexible(child: Text(label, textAlign: TextAlign.center)),
            if (!busy) ...[const SizedBox(width: 12), Icon(icon, size: 19)],
          ],
        ),
      ),
    ),
  );
}

IconData domainIcon(String id) => switch (id) {
  'idiomas' => Icons.translate_rounded,
  'preuni' => Icons.school_outlined,
  _ => Icons.auto_stories_outlined,
};
Color domainColor(String id) => switch (id) {
  'idiomas' => lavender,
  'preuni' => peach,
  _ => mint,
};
Future<T?> openScreen<T>(BuildContext context, Widget screen) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => screen));

class EmptyState extends StatelessWidget {
  const EmptyState(
    this.title,
    this.message, {
    super.key,
    this.icon = Icons.auto_stories_outlined,
  });
  final String title, message;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 28),
    child: Column(
      children: [
        CircleAvatar(
          radius: 32,
          backgroundColor: sage,
          child: Icon(icon, size: 30, color: green),
        ),
        const SizedBox(height: 18),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: muted),
        ),
      ],
    ),
  );
}
