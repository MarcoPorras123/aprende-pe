import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';
import 'setup.dart';
import 'tutor.dart';
import 'ui.dart';

class ResultScreen extends StatelessWidget {
  const ResultScreen({
    super.key,
    required this.api,
    required this.session,
    required this.catalog,
    required this.ai,
  });
  final LearningApi api;
  final StudySession session;
  final Json catalog, ai;
  void study(BuildContext context, {Json? question}) {
    final c = session.config.copy();
    if (question != null) {
      c.mode = 'practica';
      c.subject = question['subject'] ?? c.subject;
      c.topic = question['topic'] ?? c.topic;
      c.level = question['level'] ?? c.level;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) =>
            SetupScreen(api: api, catalog: catalog, ai: ai, initial: c),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final r = session.summary!;
    final outcomes = (r['outcomes'] as List).cast<Json>();
    final skills = r['skills'] as Json;
    final levels = (r['levels'] ?? {}) as Json;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tu resultado'),
        leading: IconButton(
          tooltip: 'Volver al inicio',
          onPressed: () =>
              Navigator.popUntil(context, (route) => route.isFirst),
          icon: const Icon(Icons.close),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        children: [
          Align(
            child: StudyBadge(
              '${session.config.subject} · ${modeLabels[session.config.mode]}',
              color: domainColor(session.config.domain),
              foreground: ink,
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: SizedBox(
              width: 164,
              height: 164,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox.expand(
                    child: CircularProgressIndicator(
                      value: (r['percentage'] as num) / 100,
                      strokeWidth: 10,
                      backgroundColor: const Color(0xffe2e9dc),
                      color: green,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${r['percentage']}%',
                        style: const TextStyle(
                          fontSize: 43,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -2,
                        ),
                      ),
                      const Text(
                        'de aciertos',
                        style: TextStyle(color: muted, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 26),
          Text(
            r['targetMet'] == true
                ? 'Un paso más en tu camino.'
                : 'Ya sabes por dónde seguir.',
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            '${r['correct']} de ${r['total']} correctas · Meta ${session.config.threshold}%',
            textAlign: TextAlign.center,
            style: const TextStyle(color: muted),
          ),
          if (r['unanswered'] > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                '${r['unanswered']} sin responder, incluidas en el resultado.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: muted),
              ),
            ),
          if (r['reason'] == 'expired')
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text(
                'El simulacro terminó al agotarse el tiempo.',
                textAlign: TextAlign.center,
                style: TextStyle(color: muted),
              ),
            ),
          const SizedBox(height: 24),
          SheetCard(
            color: sage,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.spa_outlined, color: green),
                    SizedBox(width: 8),
                    Text(
                      'TU SIGUIENTE PASO',
                      style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1,
                        fontWeight: FontWeight.w700,
                        color: green,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(r['recommendation']),
              ],
            ),
          ),
          const SectionTitle('Así te fue por tema'),
          SheetCard(
            child: Column(
              children: [
                for (final entry in skills.entries)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                entry.key,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            Text(
                              '${entry.value['correct']}/${entry.value['total']}',
                              style: const TextStyle(
                                color: muted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        LinearProgressIndicator(
                          value: entry.value['correct'] / entry.value['total'],
                          minHeight: 6,
                          borderRadius: BorderRadius.circular(8),
                          backgroundColor: paper,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          if (levels.isNotEmpty) ...[
            const SectionTitle('Dificultad de los ejercicios'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: levels.entries
                  .map(
                    (e) => StudyBadge(
                      '${e.key}: ${e.value['correct']}/${e.value['total']}',
                      color: lavender,
                      foreground: ink,
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 18),
          Text(
            r['levelMessage'],
            style: const TextStyle(fontSize: 12, color: muted),
          ),
          const SectionTitle('Aprende de cada respuesta'),
          ...outcomes.indexed.map((entry) {
            final (i, o) = entry;
            final q = o['question'] as Json;
            final answer = o['answer'] as Json?;
            final correct = q['type'] == 'short'
                ? q['answer']
                : q['options'][q['correctIndex']];
            final mine = o['skipped'] == true
                ? 'Sin responder'
                : q['type'] == 'short'
                ? (answer?['input'])
                : q['options'][answer?['selectedIndex'] ?? 0];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SheetCard(
                padding: 0,
                child: ExpansionTile(
                  key: ValueKey(q['id']),
                  tilePadding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 8,
                  ),
                  childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
                  shape: const Border(),
                  collapsedShape: const Border(),
                  leading: CircleAvatar(
                    radius: 17,
                    backgroundColor: o['correct'] == true ? sage : peach,
                    child: Icon(
                      o['correct'] == true ? Icons.check : Icons.remove,
                      color: green,
                      size: 19,
                    ),
                  ),
                  title: Text(
                    '${i + 1}. ${q['prompt']}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    o['correct'] == true
                        ? 'Respuesta correcta'
                        : o['skipped'] == true
                        ? 'Sin responder'
                        : 'Para reforzar',
                    style: const TextStyle(fontSize: 12, color: muted),
                  ),
                  children: [
                    if ((q['context'] ?? '').toString().isNotEmpty) ...[
                      Text(q['context']),
                      const SizedBox(height: 14),
                    ],
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Tu respuesta: $mine',
                        style: const TextStyle(color: muted),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Respuesta correcta: $correct',
                        style: const TextStyle(
                          color: green,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const Divider(height: 28),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(q['explanation']),
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Idea clave: ${q['concept']}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        q['nextStep'],
                        style: const TextStyle(color: muted),
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => study(context, question: q),
                        icon: const Icon(Icons.edit_note_rounded),
                        label: const Text('Practicar este tema'),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () => openScreen(
                        context,
                        TutorScreen(
                          api: api,
                          sessionId: session.id,
                          question: q,
                          source: session.config.source,
                        ),
                      ),
                      icon: const Icon(Icons.chat_bubble_outline, size: 18),
                      label: Text(
                        session.config.source == 'ai'
                            ? 'Consultar al tutor'
                            : 'Ver explicación guiada',
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          PrimaryAction(
            'Volver a probarme',
            onPressed: () => study(context),
            icon: Icons.refresh_rounded,
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () =>
                  Navigator.popUntil(context, (route) => route.isFirst),
              child: const Text('Volver al inicio'),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            session.config.source == 'ai'
                ? 'Contenido generado con IA y revisión automática.'
                : 'Resultados de ejercicios de muestra.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: muted),
          ),
        ],
      ),
    );
  }
}
