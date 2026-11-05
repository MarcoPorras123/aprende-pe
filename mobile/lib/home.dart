import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';
import 'setup.dart';
import 'session.dart';
import 'result.dart';
import 'ui.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api});
  final LearningApi api;
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  Json? data;
  String? error;
  bool loading = true;
  int tab = 0;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    load(initialize: true);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        ModalRoute.of(context)?.isCurrent == true) {
      load();
    }
  }

  Future<void> load({bool initialize = false}) async {
    if (mounted) setState(() => loading = true);
    try {
      if (initialize) await widget.api.initialize();
      final value = await widget.api.bootstrap();
      if (mounted) {
        setState(() {
          data = value;
          error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> setup({
    String domain = 'idiomas',
    String mode = 'diagnostico',
  }) async {
    if (data == null) return;
    if (data!['active'] != null) {
      await resume(StudySession(data!['active']));
      return;
    }
    final subjects = (data!['catalog'][domain]['subjects'] as List)
        .cast<String>();
    await openScreen(
      context,
      SetupScreen(
        api: widget.api,
        catalog: data!['catalog'],
        ai: data!['ai'],
        initial: StudyConfig(
          domain: domain,
          subject: subjects.first,
          mode: mode,
        ),
      ),
    );
    if (mounted) load();
  }

  Future<void> resume(StudySession s) async {
    await openScreen(
      context,
      s.completed
          ? ResultScreen(
              api: widget.api,
              session: s,
              catalog: data!['catalog'],
              ai: data!['ai'],
            )
          : SessionScreen(
              api: widget.api,
              session: s,
              catalog: data!['catalog'],
              ai: data!['ai'],
            ),
    );
    if (mounted) load();
  }

  Future<void> viewHistory(Json h) async {
    setState(() => loading = true);
    try {
      final s = await widget.api.session(h['id']);
      if (mounted) await resume(s);
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  List<Json> get history =>
      ((data?['history'] ?? []) as List).cast<Json>().reversed.toList();
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      toolbarHeight: 76,
      title: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: green,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.spa_outlined,
              color: Colors.white,
              size: 23,
            ),
          ),
          const SizedBox(width: 10),
          const Text(
            'aprende pe!',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 21,
              letterSpacing: -.6,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: 'Conexión y perfil',
          onPressed: () async {
            await openScreen(
              context,
              ConnectionScreen(api: widget.api, ai: data?['ai']),
            );
            if (mounted) load();
          },
          icon: const CircleAvatar(
            radius: 19,
            backgroundColor: sage,
            child: Icon(Icons.person_outline_rounded, color: green, size: 22),
          ),
        ),
        const SizedBox(width: 12),
      ],
    ),
    body: RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 30),
        children: [
          if (loading) const LinearProgressIndicator(minHeight: 2),
          if (error != null) ErrorNote(error!, retry: load),
          if (data == null && !loading) ...[
            const EmptyState(
              'Tu espacio para aprender',
              'Conecta la aplicación con el servidor para recuperar tus sesiones y comenzar.',
            ),
            PrimaryAction(
              'Configurar conexión',
              onPressed: () async {
                await openScreen(context, ConnectionScreen(api: widget.api));
                if (mounted) load();
              },
            ),
          ],
          if (data != null)
            ...switch (tab) {
              0 => homeContent(context),
              1 => studyContent(context),
              2 => historyContent(context),
              _ => progressContent(context),
            },
        ],
      ),
    ),
    bottomNavigationBar: NavigationBar(
      selectedIndex: tab,
      onDestinationSelected: (i) => setState(() => tab = i),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: 'Inicio',
        ),
        NavigationDestination(
          icon: Icon(Icons.auto_stories_outlined),
          selectedIcon: Icon(Icons.auto_stories),
          label: 'Estudiar',
        ),
        NavigationDestination(
          icon: Icon(Icons.history_rounded),
          label: 'Historial',
        ),
        NavigationDestination(
          icon: Icon(Icons.insights_outlined),
          selectedIcon: Icon(Icons.insights),
          label: 'Mi progreso',
        ),
      ],
    ),
  );
  List<Widget> homeContent(BuildContext context) {
    final active = data!['active'];
    return [
      const Text(
        'UN POCO CADA DÍA',
        style: TextStyle(
          fontSize: 10,
          letterSpacing: 2,
          fontWeight: FontWeight.w700,
          color: muted,
        ),
      ),
      const SizedBox(height: 12),
      Text(
        'Descubre lo que sabes.\nConstruye lo que sigue.',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 14),
      const Text(
        'Evalúate, resuelve tus dudas y avanza a tu ritmo.',
        style: TextStyle(color: muted, fontSize: 15),
      ),
      const SizedBox(height: 24),
      SheetCard(
        color: green,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const StudyBadge(
                  'TU SIGUIENTE PASO',
                  color: Color(0xff3c705b),
                  foreground: Colors.white,
                ),
                const Spacer(),
                Icon(
                  active != null
                      ? Icons.play_circle_outline
                      : Icons.explore_outlined,
                  color: const Color(0xffc6dcb6),
                  size: 33,
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(
              active != null
                  ? 'Retoma donde lo dejaste'
                  : '¿Por dónde empezamos?',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: Colors.white,
                letterSpacing: -.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              active != null
                  ? '${active['config']['subject']} · ${(active['answers'] as List).length} de ${(active['items'] as List).length} respuestas guardadas'
                  : 'Una evaluación breve para encontrar tus fortalezas y lo que puedes mejorar.',
              style: const TextStyle(color: Color(0xffd5e5d6), height: 1.5),
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xffe4efcd),
                  foregroundColor: ink,
                ),
                onPressed: () =>
                    active != null ? resume(StudySession(active)) : setup(),
                icon: const Icon(Icons.arrow_forward, size: 19),
                iconAlignment: IconAlignment.end,
                label: Text(
                  active != null
                      ? 'Continuar sesión'
                      : 'Conocer mi punto de partida',
                ),
              ),
            ),
          ],
        ),
      ),
      const SectionTitle('¿Qué quieres aprender?'),
      ...domainCards(),
      const SectionTitle('Tres formas de avanzar'),
      ...modeCards(),
      const SizedBox(height: 24),
      Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.verified_user_outlined, size: 18, color: muted),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              data!['ai']['verified'] == true
                  ? 'La IA está conectada. Puedes elegir contenido generado o ejercicios de muestra.'
                  : data!['ai']['ready'] == true
                  ? 'IA configurada, pendiente de disponibilidad. Puedes comenzar con los ejercicios de muestra.'
                  : 'Puedes comenzar con ejercicios de muestra y sus explicaciones.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> domainCards() => domainLabels.entries
      .map(
        (e) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: SheetCard(
            color: domainColor(e.key),
            padding: 17,
            onTap: () => setup(domain: e.key),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .6),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Icon(domainIcon(e.key), color: ink),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        e.value,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(switch (e.key) {
                        'idiomas' => 'Inglés y francés',
                        'preuni' => 'Prepárate para tu siguiente paso',
                        _ => 'Refuerza el curso que necesitas',
                      }, style: const TextStyle(fontSize: 12, color: muted)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_rounded, size: 19),
              ],
            ),
          ),
        ),
      )
      .toList();
  List<Widget> modeCards() => [
    for (final (id, icon, subtitle) in [
      (
        'diagnostico',
        Icons.explore_outlined,
        'Identifica tus fortalezas y tus dudas.',
      ),
      (
        'practica',
        Icons.edit_note_rounded,
        'Un tema, explicaciones y tu ritmo.',
      ),
      ('simulacro', Icons.timer_outlined, 'Ponte a prueba contra el reloj.'),
    ])
      Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: SheetCard(
          padding: 16,
          onTap: () => setup(mode: id),
          child: Row(
            children: [
              Icon(icon, color: green, size: 26),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      modeLabels[id]!,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: muted),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 20),
            ],
          ),
        ),
      ),
  ];
  List<Widget> studyContent(BuildContext context) => [
    Text(
      'Tu próximo aprendizaje',
      style: Theme.of(context).textTheme.headlineMedium,
    ),
    const SizedBox(height: 12),
    const Text(
      'Elige un área. Después podrás evaluarte, practicar un tema o hacer un simulacro.',
      style: TextStyle(color: muted),
    ),
    const SizedBox(height: 24),
    ...domainCards(),
    const SectionTitle('Elige cómo estudiar'),
    ...modeCards(),
  ];
  List<Widget> historyContent(BuildContext context) => [
    Text('Tu recorrido', style: Theme.of(context).textTheme.headlineMedium),
    const SizedBox(height: 10),
    const Text(
      'Cada intento cuenta. Vuelve a tus respuestas y aprende de ellas.',
      style: TextStyle(color: muted),
    ),
    if (history.isEmpty)
      const EmptyState(
        'Tu primera sesión te espera',
        'Cuando termines una actividad, encontrarás aquí tus resultados.',
        icon: Icons.history_rounded,
      ),
    for (final h in history)
      Padding(
        padding: const EdgeInsets.only(top: 14),
        child: SheetCard(
          onTap: () => viewHistory(h),
          child: Row(
            children: [
              CircleAvatar(
                radius: 27,
                backgroundColor: domainColor(h['config']['domain']),
                child: Text(
                  '${h['percentage']}%',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: ink,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      h['config']['subject'],
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      '${modeLabels[h['config']['mode']]} · ${h['correct']}/${h['total']}',
                      style: const TextStyle(fontSize: 12, color: muted),
                    ),
                    Text(
                      dateLabel(h['completedAt']),
                      style: const TextStyle(fontSize: 11, color: muted),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
  ];
  List<Widget> progressContent(BuildContext context) {
    final total = history.fold<int>(0, (v, h) => v + (h['total'] as int));
    final correct = history.fold<int>(0, (v, h) => v + (h['correct'] as int));
    final weak = history
        .expand((h) => (h['weak'] as List).cast<String>())
        .toSet();
    return [
      Text(
        'Mira cuánto avanzas',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 10),
      const Text(
        'Tu desempeño en las sesiones realizadas.',
        style: TextStyle(color: muted),
      ),
      const SizedBox(height: 24),
      Row(
        children: [
          Expanded(
            child: SheetCard(
              color: sage,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${history.length}',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const Text(
                    'Sesiones completadas',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SheetCard(
              color: lavender,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    total == 0 ? '—' : '${(correct / total * 100).round()}%',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const Text(
                    'Aciertos acumulados',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      if (history.isEmpty)
        const EmptyState(
          'El progreso empieza contigo',
          'Completa una sesión para ver qué reforzar.',
          icon: Icons.insights,
        ),
      if (weak.isNotEmpty) ...[
        const SectionTitle('Temas para volver a mirar'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: weak
              .map((s) => StudyBadge(s, color: peach, foreground: ink))
              .toList(),
        ),
        const SizedBox(height: 16),
        const Text(
          'Son temas que quedaron bajo tu meta en algún intento. Revisa los resultados más recientes para decidir qué practicar.',
          style: TextStyle(color: muted, fontSize: 12),
        ),
      ],
      const SectionTitle('Tu meta, a tu medida'),
      const SheetCard(
        child: Text(
          'Puedes elegir una meta de 70%, 80% o 90% en cada sesión. Alcanzarla es una señal para comprobar lo aprendido con nuevas preguntas.',
        ),
      ),
      const SizedBox(height: 20),
      const Text(
        'Los resultados corresponden a los ejercicios resueltos; no certifican un nivel MCER ni una nota oficial.',
        style: TextStyle(fontSize: 12, color: muted),
      ),
    ];
  }
}

class ConnectionScreen extends StatefulWidget {
  const ConnectionScreen({super.key, required this.api, this.ai});
  final LearningApi api;
  final Json? ai;
  @override
  State<ConnectionScreen> createState() => _ConnectionScreenState();
}

class _ConnectionScreenState extends State<ConnectionScreen> {
  late final controller = TextEditingController(text: widget.api.baseUrl);
  String? error;
  bool busy = false;
  String? success;
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> save() async {
    setState(() {
      busy = true;
      error = null;
      success = null;
    });
    try {
      await widget.api.configure(controller.text);
      await widget.api.bootstrap();
      if (mounted) {
        setState(() => success = 'Conexión comprobada. Ya puedes comenzar.');
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Conexión y perfil')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CircleAvatar(
          radius: 34,
          backgroundColor: sage,
          child: Icon(Icons.person_outline, size: 35, color: green),
        ),
        const SizedBox(height: 16),
        Text(
          'Tu espacio de estudio',
          style: Theme.of(context).textTheme.headlineMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        const Text(
          'Usas un perfil de invitado en este dispositivo. Las sesiones y resultados se guardan en el servidor.',
          textAlign: TextAlign.center,
          style: TextStyle(color: muted),
        ),
        const SectionTitle('Servidor de aprendizaje'),
        TextField(
          controller: controller,
          readOnly: widget.api.browser,
          keyboardType: TextInputType.url,
          autocorrect: false,
          decoration: const InputDecoration(
            labelText: 'Dirección del servidor',
            hintText: 'https://api.tudominio.pe',
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'Cambiar de servidor abre un historial independiente. La clave de OpenAI la administra el servidor; no se introduce en el teléfono.',
          style: TextStyle(fontSize: 12, color: muted),
        ),
        if (error != null) ErrorNote(error!),
        if (success != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(success!, style: const TextStyle(color: green)),
          ),
        if (!widget.api.browser) ...[
          const SizedBox(height: 20),
          PrimaryAction('Guardar y comprobar', onPressed: save, busy: busy),
        ],
        const SectionTitle('Disponibilidad de IA'),
        SheetCard(
          child: Text(
            widget.ai?['label'] ?? 'Se comprobará al conectar con el servidor.',
          ),
        ),
        const SectionTitle('Sobre tus resultados'),
        const Text(
          'Los ejercicios de muestra y los simulacros generales sirven para practicar. Todavía no hay modelos oficiales verificados, certificación de idiomas ni evaluación de audio.',
          style: TextStyle(color: muted),
        ),
        const SizedBox(height: 20),
        const Text(
          'Aprende Pe! · Flutter · versión 0.4.0',
          style: TextStyle(color: muted, fontSize: 12),
        ),
      ],
    ),
  );
}
