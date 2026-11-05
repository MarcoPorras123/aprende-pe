import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';
import 'ui.dart';

class TutorScreen extends StatefulWidget {
  const TutorScreen({
    super.key,
    required this.api,
    required this.sessionId,
    required this.question,
    required this.source,
  });
  final LearningApi api;
  final String sessionId, source;
  final Json question;
  @override
  State<TutorScreen> createState() => _TutorScreenState();
}

class _TutorScreenState extends State<TutorScreen> {
  final input = TextEditingController();
  final scroll = ScrollController();
  final List<({String text, bool user})> messages = [];
  bool busy = false;
  String? error;
  @override
  void dispose() {
    input.dispose();
    scroll.dispose();
    super.dispose();
  }

  Future<void> send([String? prompt]) async {
    final message = (prompt ?? input.text).trim();
    if (message.isEmpty || busy) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final answer = await widget.api.tutor(
        widget.sessionId,
        widget.question['id'],
        message,
      );
      if (mounted) {
        setState(() {
          messages.add((text: message, user: true));
          messages.add((text: answer['text'], user: false));
          input.clear();
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (scroll.hasClients) {
            scroll.animateTo(
              scroll.position.maxScrollExtent,
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
            );
          }
        });
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.source == 'ai' ? 'Tu tutor' : 'Guía del ejercicio'),
    ),
    body: Column(
      children: [
        Expanded(
          child: ListView(
            controller: scroll,
            padding: const EdgeInsets.all(24),
            children: [
              StudyBadge(
                widget.source == 'ai'
                    ? 'Tutor con IA · este ejercicio'
                    : 'Explicación del catálogo · sin IA',
                icon: Icons.spa_outlined,
              ),
              const SizedBox(height: 18),
              Text(
                widget.question['prompt'],
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 20),
              SheetCard(
                color: sage,
                child: Text(
                  widget.source == 'ai'
                      ? 'Repasemos esta pregunta. Puedes pedirme que explique el concepto, los pasos o cómo practicarlo.'
                      : 'Puedo mostrarte la solución y el concepto de este ejercicio. Esta guía usa explicaciones del catálogo; la conversación libre requiere una sesión con IA.',
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final text in [
                    'Explícame el concepto',
                    'Explícalo más sencillo',
                    '¿Cómo puedo practicar?',
                  ])
                    ActionChip(
                      label: Text(text, style: const TextStyle(fontSize: 12)),
                      onPressed: busy ? null : () => send(text),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              for (final m in messages)
                Align(
                  alignment: m.user
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: SheetCard(
                      color: m.user ? green : Colors.white,
                      padding: 16,
                      child: Text(
                        m.text,
                        style: TextStyle(
                          color: m.user ? Colors.white : ink,
                          height: 1.6,
                        ),
                      ),
                    ),
                  ),
                ),
              if (busy)
                const Padding(
                  padding: EdgeInsets.all(14),
                  child: Row(
                    children: [
                      SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 12),
                      Text('Preparando la explicación…'),
                    ],
                  ),
                ),
              if (error != null) ErrorNote(error!),
            ],
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: input,
                    enabled: !busy,
                    maxLength: 1200,
                    minLines: 1,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Escribe tu duda…',
                      counterText: '',
                    ),
                    onSubmitted: (_) => send(),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton.filled(
                  tooltip: 'Enviar pregunta',
                  onPressed: busy ? null : () => send(),
                  icon: const Icon(Icons.arrow_upward_rounded),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}
