import type { TutorialStep } from './TutorialOverlay'

export const anamnesisTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tutorial="anamnesis-welcome"]',
    placement: 'bottom',
    title: 'Анамнез жизни',
    body: 'Главная страница для диагностики. Здесь вы вводите жалобы пациента и получаете гипотезы по клиническим протоколам МЗ РК.',
  },
  {
    id: 'input',
    targetSelector: '[data-tutorial="anamnesis-input"]',
    placement: 'right',
    title: 'Ввод анамнеза',
    body: 'Опишите симптомы в свободной форме или выберите пример ниже. До 2000 символов на русском.',
  },
  {
    id: 'analyze',
    targetSelector: '[data-tutorial="anamnesis-analyze"]',
    placement: 'top',
    title: 'Анализ',
    body: 'Нажмите «Анализировать» — система найдёт протоколы и вернёт основной диагноз с МКБ-10 и дифференциальные варианты.',
  },
  {
    id: 'results',
    targetSelector: '[data-tutorial="anamnesis-results"]',
    placement: 'right',
    title: 'Результаты',
    body: 'Здесь появятся диагноз, код МКБ-10 и ссылка на протокол MedElement. История сохраняется в разделе «История».',
  },
  {
    id: 'api',
    targetSelector: '[data-tutorial="anamnesis-api"]',
    placement: 'left',
    title: 'Для организаторов',
    body: 'Оценка: POST /diagnose с телом {"symptoms": "..."}. Ответ — список диагнозов (icd10_code, diagnosis, explanation, protocol_id).',
  },
]
