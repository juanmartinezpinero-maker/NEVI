# nevi

App de IA que ayuda a familias a saber qué necesitan comprar analizando sus tickets de supermercado.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS 4
- Fuentes: [Fraunces](https://fonts.google.com/specimen/Fraunces) (titulares) e [Inter](https://fonts.google.com/specimen/Inter) (cuerpo)

## Estructura

```
app/         páginas y layout (App Router)
components/  componentes reutilizables (ProductCard, SavingsCard, AIInsightBanner, BottomNav...)
lib/         utilidades y datos de ejemplo
types/       tipos compartidos
```

## Empezar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Por ahora el Dashboard usa datos de ejemplo hardcodeados en `lib/mock-data.ts`; la integración con backend llegará en una siguiente fase.
