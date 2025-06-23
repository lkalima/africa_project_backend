// src/utils/extractPlainText.ts

// Define a type for the nodes we expect in our Rich Text JSON.
// This makes the code much safer and easier to understand.
type RichTextNode = {
  type: string
  text?: string
  children?: RichTextNode[]
  [key: string]: unknown // Allow other properties
}

// This is our recursive helper function, now fully typed.
function recursiveExtract(nodes: RichTextNode[]): string[] {
  const textNodes: string[] = []

  if (!nodes) {
    return textNodes
  }

  nodes.forEach((node) => {
    if (node && node.type === 'text' && typeof node.text === 'string') {
      textNodes.push(node.text)
    } else if (node && node.children) {
      // If it's not a text node but has children, recurse into them.
      textNodes.push(...recursiveExtract(node.children))
    }
  })

  return textNodes
}

// This is the main exported function.
export const extractPlainText = (richTextObject: {
  root?: { children?: RichTextNode[] }
}): string => {
  if (!richTextObject?.root?.children) {
    return ''
  }

  const allText = recursiveExtract(richTextObject.root.children)

  // Join all found text nodes and clean up whitespace.
  return allText.join(' ').replace(/\s\s+/g, ' ').trim()
}
