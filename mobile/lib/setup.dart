import 'dart:convert';

import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';
import 'session.dart';
import 'ui.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({
    super.key,
    required this.api,
    required this.catalog,
    required this.ai,
    required this.initial,
  });
  final LearningApi api;
  final Json catalog, ai;
  final StudyConfig initial;
  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  late StudyConfig c = widget.initial.copy();
  int step = 0;
  bool busy = false;
  String? error;
  String? creationKey;
  bool customSubject = false, customTopic = false;
  final subjectInput = TextEditingController(),
      topicInput = TextEditingController();
  final scroll = ScrollController();
  @override
  void initState() {
    super.initState();
    customSubject = !subjects.contains(c.subject);
    customTopic = !topics.contains(c.topic);
    subjectInput.text = c.subject;
    topicInput.text = c.topic;
  }

  @override
  void dispose() {
    subjectInput.dispose();
    topicInput.dispose();
    scroll.dispose();
    super.dispose();
  }

  List<String> get subjects =>
      (widget.catalog[c.domain]['subjects'] as List).cast<String>();
  List<String> get topics =>
      ((customSubject
                  ? ['General']
                  : widget.catalog[c.domain]['topics'][c.subject] ??
                        ['General'])
              as List)
          .cast<String>();
  void change(VoidCallback fn) {
    setState(() {
      fn();
      creationKey = null;
      error = null;
    });
  }

  void setDomain(String d) {
    c.domain = d;
    c.subject = subjects.first;
    c.topic = 'General';
    c.level = 'auto';
    customSubject = false;
    customTopic = false;
  }

  void next() {
    if (step == 1) {
      if (customSubject) c.subject = subjectInput.text.trim();
      if (customTopic) c.topic = topicInput.text.trim();
      if (c.subject.isEmpty || c.topic.isEmpty) {
        setState(
          () => error = 'Escribe el curso y el tema que quieres estudiar.',
        );
        return;
      }
    }
    setState(() {
      step++;
      error = null;
    });
    scroll.jumpTo(0);
  }

  Future<void> start() async {
    setState(() {
      busy = true;
      error = null;
    });
    creationKey ??= requestId();
    StudySession? s;
    try {
      s = await widget.api.create(c, creationKey!);
    } catch (e) {
      // Reconcile a lost response before allowing a retry of the same creation key.
      if (e is ApiException && (e.status == 0 || e.status == 409)) {
        try {
          final b = await widget.api.bootstrap();
          if (b['active'] != null) {
            final active = StudySession(b['active']);
            if (jsonEncode(active.config.toJson()) == jsonEncode(c.toJson())) {
              s = active;
            }
          }
        } catch (_) {
          /* Keep the original error and idempotency key. */
        }
      }
      if (s == null && mounted) setState(() => error = e.toString());
    }
    if (!mounted) return;
    setState(() => busy = false);
    if (s != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => SessionScreen(
            api: widget.api,
            session: s!,
            catalog: widget.catalog,
            ai: widget.ai,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !busy,
    child: Scaffold(
      appBar: AppBar(
        title: const Text('Prepara tu sesión'),
        leading: IconButton(
          tooltip: 'Atrás',
          onPressed: busy
              ? null
              : () {
                  if (step == 0) {
                    Navigator.pop(context);
                  } else {
                    setState(() {
                      step--;
                      error = null;
                    });
                    scroll.jumpTo(0);
                  }
                },
          icon: const Icon(Icons.arrow_back_rounded),
        ),
      ),
      body: ListView(
        controller: scroll,
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        children: [
          Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: LinearProgressIndicator(
                    value: i <= step ? 1 : 0,
                    minHeight: 4,
                    borderRadius: BorderRadius.circular(8),
                    backgroundColor: const Color(0xffe0e6da),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 22),
          Text(
            'PASO ${step + 1} DE 3',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
              color: muted,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            [
              '¿Qué te gustaría lograr?',
              'Vamos a enfocarnos.',
              'Una sesión a tu medida.',
            ][step],
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 18),
          SheetCard(
            color: sage,
            padding: 16,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.spa_outlined, color: green, size: 23),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    [
                      'Primero, elige el área y cómo quieres estudiar hoy.',
                      '¿Un curso en particular o una evaluación general? Tú decides dónde concentrarte.',
                      'Revisa tu objetivo. Al terminar recibirás las respuestas explicadas y qué conviene reforzar.',
                    ][step],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          IgnorePointer(
            ignoring: busy,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: switch (step) {
                0 => areaStep(),
                1 => topicStep(),
                _ => reviewStep(),
              },
            ),
          ),
          if (error != null) ErrorNote(error!),
          if (busy)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Text(
                'Estamos preparando y revisando las preguntas. Puede tardar un momento.',
                style: TextStyle(color: muted),
              ),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
          child: PrimaryAction(
            step < 2 ? 'Continuar' : 'Comenzar sesión',
            onPressed: step < 2 ? next : start,
            busy: busy,
          ),
        ),
      ),
    ),
  );
  List<Widget> areaStep() => [
    const Text(
      'ÁREA DE ESTUDIO',
      style: TextStyle(
        color: muted,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1,
      ),
    ),
    const SizedBox(height: 12),
    for (final e in domainLabels.entries)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: selectTile(
          e.value,
          domainIcon(e.key),
          c.domain == e.key,
          () => change(() => setDomain(e.key)),
          color: domainColor(e.key),
        ),
      ),
    const SectionTitle('¿Cómo quieres estudiar?'),
    for (final (id, desc, icon) in [
      (
        'diagnostico',
        'Resuelve y revisa todo al terminar.',
        Icons.explore_outlined,
      ),
      (
        'practica',
        'Aprende con feedback en cada pregunta.',
        Icons.edit_note_rounded,
      ),
      ('simulacro', 'Una evaluación con tiempo límite.', Icons.timer_outlined),
    ])
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: selectTile(
          modeLabels[id]!,
          icon,
          c.mode == id,
          () => change(() => c.mode = id),
          subtitle: desc,
        ),
      ),
  ];
  Widget selectTile(
    String title,
    IconData icon,
    bool selected,
    VoidCallback tap, {
    String? subtitle,
    Color color = Colors.white,
  }) => Semantics(
    selected: selected,
    child: Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: selected ? green : Colors.transparent,
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: SheetCard(
        color: color,
        padding: 16,
        onTap: tap,
        child: Row(
          children: [
            Icon(icon, color: green),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: muted),
                    ),
                ],
              ),
            ),
            Icon(
              selected ? Icons.check_circle : Icons.circle_outlined,
              color: selected ? green : const Color(0xffcbd5ca),
              size: 21,
            ),
          ],
        ),
      ),
    ),
  );
  Widget drop(
    String label,
    String value,
    List<String> values,
    ValueChanged<String> onChange, {
    Map<String, String> labels = const {},
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 18),
    child: DropdownButtonFormField<String>(
      key: ValueKey('$label:$value:${values.join()}'),
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: values
          .map(
            (v) => DropdownMenuItem(
              value: v,
              child: Text(labels[v] ?? v, overflow: TextOverflow.ellipsis),
            ),
          )
          .toList(),
      onChanged: (v) {
        if (v != null) change(() => onChange(v));
      },
    ),
  );
  List<Widget> topicStep() => [
    const Text(
      'CONTENIDO DE LA SESIÓN',
      style: TextStyle(color: muted, fontSize: 11, fontWeight: FontWeight.w700),
    ),
    const SizedBox(height: 10),
    Wrap(
      spacing: 8,
      runSpacing: 6,
      children: [
        ChoiceChip(
          label: const Text('Ejercicios de muestra'),
          selected: c.source == 'demo',
          onSelected: (_) => change(() {
            c.source = 'demo';
            if (!subjects.contains(c.subject)) c.subject = subjects.first;
            if (!topics.contains(c.topic)) c.topic = 'General';
            if (['B2', 'C1', 'C2'].contains(c.level)) c.level = 'auto';
            customSubject = false;
            customTopic = false;
          }),
        ),
        ChoiceChip(
          label: const Text('Generar con IA'),
          selected: c.source == 'ai',
          onSelected: widget.ai['ready'] == true
              ? (_) => change(() => c.source = 'ai')
              : null,
        ),
      ],
    ),
    const SizedBox(height: 8),
    Text(
      c.source == 'ai'
          ? 'Preguntas nuevas para el tema elegido, con revisión automática. Requiere disponibilidad y crédito del servidor.'
          : 'Contenido disponible para probar y practicar. No es generación con IA.',
      style: const TextStyle(fontSize: 12, color: muted),
    ),
    const SizedBox(height: 24),
    drop(
      c.domain == 'idiomas' ? 'Idioma' : 'Curso',
      customSubject ? '__custom' : c.subject,
      [...subjects, if (c.source == 'ai' && c.domain != 'idiomas') '__custom'],
      (v) {
        customSubject = v == '__custom';
        if (customSubject) subjectInput.clear();
        if (!customSubject) c.subject = v;
        c.topic = 'General';
        customTopic = false;
      },
      labels: const {'__custom': 'Escribir otro curso…'},
    ),
    if (customSubject)
      Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: TextField(
          controller: subjectInput,
          maxLength: 100,
          onChanged: (_) => creationKey = null,
          decoration: const InputDecoration(
            labelText: '¿Qué curso quieres estudiar?',
          ),
        ),
      ),
    drop(
      'Tema',
      customTopic ? '__custom' : c.topic,
      [...topics, if (c.source == 'ai') '__custom'],
      (v) {
        customTopic = v == '__custom';
        if (!customTopic) c.topic = v;
      },
      labels: const {'__custom': 'Escribir un tema específico…'},
    ),
    if (customTopic)
      Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: TextField(
          controller: topicInput,
          maxLength: 120,
          onChanged: (_) => creationKey = null,
          decoration: const InputDecoration(labelText: 'Tema específico'),
        ),
      ),
    if (c.domain == 'idiomas') ...[
      drop(
        'Nivel de los ejercicios',
        c.level,
        [
          'auto',
          'A1',
          'A2',
          'B1',
          if (c.source == 'ai') ...['B2', 'C1', 'C2'],
        ],
        (v) => c.level = v,
        labels: const {'auto': 'Explorar varios niveles'},
      ),
      const Text(
        'Esto selecciona la dificultad de los ejercicios; el resultado no certifica tu nivel global de idioma.',
        style: TextStyle(fontSize: 12, color: muted),
      ),
    ],
    if (c.mode == 'simulacro') ...[
      const SizedBox(height: 16),
      const SheetCard(
        color: peach,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Simulacro general',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            SizedBox(height: 8),
            Text(
              'Todavía no se han incorporado modelos oficiales verificados de universidades o exámenes de idiomas. Esta sesión será una práctica general con tiempo.',
            ),
          ],
        ),
      ),
    ],
  ];
  List<Widget> reviewStep() => [
    SheetCard(
      color: domainColor(c.domain),
      child: Row(
        children: [
          Icon(domainIcon(c.domain), size: 30),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  c.subject,
                  style: const TextStyle(
                    fontSize: 21,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text('${modeLabels[c.mode]} · ${c.topic}'),
                const SizedBox(height: 6),
                Text(
                  c.source == 'ai'
                      ? 'Contenido generado con IA'
                      : 'Ejercicios de muestra',
                  style: const TextStyle(fontSize: 12, color: muted),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
    const SectionTitle('Duración y objetivo'),
    drop('Preguntas', '${c.count}', [
      '3',
      '6',
      '10',
    ], (v) => c.count = int.parse(v)),
    drop(
      'Meta de aciertos',
      '${c.threshold}',
      ['70', '80', '90'],
      (v) => c.threshold = int.parse(v),
      labels: const {
        '70': '70% · Meta personal',
        '80': '80% · Meta personal',
        '90': '90% · Meta personal',
      },
    ),
    if (c.mode == 'simulacro')
      drop(
        'Tiempo disponible',
        '${c.minutes}',
        ['5', '10', '20'],
        (v) => c.minutes = int.parse(v),
        labels: const {
          '5': '5 minutos',
          '10': '10 minutos',
          '20': '20 minutos',
        },
      ),
    if (c.source == 'demo' && c.domain != 'idiomas')
      drop(
        'Tipo de respuesta',
        c.format,
        ['choice', 'mixed'],
        (v) => c.format = v,
        labels: const {
          'choice': 'Marcar alternativas',
          'mixed': 'Alternativas y números cuando corresponda',
        },
      ),
    const SizedBox(height: 6),
    Text(
      c.mode == 'practica'
          ? 'Recibirás una explicación después de cada respuesta y podrás consultar la guía del ejercicio.'
          : 'Las respuestas y explicaciones se muestran al finalizar. Puedes salir y continuar; en simulacro, el reloj sigue avanzando.',
      style: const TextStyle(color: muted),
    ),
    const SizedBox(height: 12),
    const Text(
      'Las preguntas ya asignadas a este perfil se excluyen. Si se agota la muestra, podrás elegir otro tema o ampliar el alcance.',
      style: TextStyle(fontSize: 12, color: muted),
    ),
  ];
}
