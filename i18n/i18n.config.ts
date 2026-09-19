// Russian and Ukrainian need three plural forms; vue-i18n's default rule only
// handles the two-form (English) shape.
function slavicPluralRule(choice: number, choicesLength: number): number {
    if (choicesLength < 3) return choice === 1 ? 0 : 1

    const mod10 = choice % 10
    const mod100 = choice % 100

    if (mod10 === 1 && mod100 !== 11) return 0
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1
    return 2
}

export default defineI18nConfig(() => ({
    legacy: false,
    pluralRules: {
        ru: slavicPluralRule,
        uk: slavicPluralRule,
    },
}))
