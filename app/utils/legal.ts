export function legalLinkProps(
    externalUrl: string | null | undefined,
    internalPath: string,
) {
    return externalUrl
        ? { href: externalUrl, target: '_blank', rel: 'noopener noreferrer' }
        : { to: internalPath }
}
