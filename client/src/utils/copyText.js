export function copyText(text) {
    navigator.clipboard.writeText(text).then(
        () => alert('Text successfully copied to clipboard!'),
        (err) => console.error('Failed to copy text: ', err)
    );
}