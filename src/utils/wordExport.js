import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, Style, UnderlineType, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import * as Sentry from '@sentry/browser';

/**
 * Converts HTML-formatted text to plain text with basic formatting detection
 * @param {string} html - HTML content to convert
 * @returns {string} - Plain text version
 */
const htmlToPlainText = (html) => {
  // Create temporary element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content and preserve some spacing
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

/**
 * Creates basic formatted paragraphs for Word document from HTML
 * @param {string} html - HTML content to convert
 * @returns {Array} - Array of docx Paragraph objects
 */
const createDocumentParagraphs = (html) => {
  // Create temporary element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const paragraphs = [];
  
  // Define text styles
  const normalStyle = {
    font: "Arial",
    size: 24, // 12pt
  };
  
  const headingStyle = {
    font: "Arial",
    size: 28, // 14pt
    bold: true,
  };
  
  const subheadingStyle = {
    font: "Arial",
    size: 26, // 13pt
    bold: true,
  };
  
  // Process each child node to create appropriate Word elements
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: node.textContent.trim(),
            ...normalStyle,
          })],
          spacing: { after: 200 }
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Process by tag type
      if (node.tagName === 'P') {
        const textRuns = [];
        
        // Handle inline formatting inside paragraphs
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            textRuns.push(new TextRun({
              text: child.textContent,
              ...normalStyle,
            }));
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === 'STRONG' || child.tagName === 'B') {
              textRuns.push(new TextRun({
                text: child.textContent,
                bold: true,
                ...normalStyle,
              }));
            } else if (child.tagName === 'EM' || child.tagName === 'I') {
              textRuns.push(new TextRun({
                text: child.textContent,
                italic: true,
                ...normalStyle,
              }));
            } else if (child.tagName === 'U') {
              textRuns.push(new TextRun({
                text: child.textContent,
                underline: {
                  type: UnderlineType.SINGLE,
                },
                ...normalStyle,
              }));
            } else if (child.tagName === 'BR') {
              textRuns.push(new TextRun({
                text: "",
                break: 1,
                ...normalStyle,
              }));
            } else {
              textRuns.push(new TextRun({
                text: child.textContent,
                ...normalStyle,
              }));
            }
          }
        });
        
        if (textRuns.length === 0) {
          textRuns.push(new TextRun({
            text: node.textContent.trim(),
            ...normalStyle,
          }));
        }
        
        paragraphs.push(new Paragraph({
          children: textRuns,
          spacing: { after: 200 }
        }));
      } else if (['H1', 'H2', 'H3', 'H4'].includes(node.tagName)) {
        // Map heading levels
        const headingLevelMap = {
          'H1': HeadingLevel.HEADING_1,
          'H2': HeadingLevel.HEADING_2,
          'H3': HeadingLevel.HEADING_3,
          'H4': HeadingLevel.HEADING_4
        };
        
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: node.textContent.trim(),
            ...headingStyle,
          })],
          heading: headingLevelMap[node.tagName],
          spacing: { before: 300, after: 200 }
        }));
      } else if (node.tagName === 'LI') {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: `• ${node.textContent.trim()}`,
            ...normalStyle,
          })],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 120 }
        }));
      } else if (node.tagName === 'BR') {
        paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
      } else {
        // Default handling for other elements
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: node.textContent.trim(),
            ...normalStyle,
          })],
          spacing: { after: 200 }
        }));
      }
    }
  });
  
  return paragraphs;
};

/**
 * Generate a Word document from report content
 * @param {string} html - HTML content to convert to Word
 * @param {Object} metadata - Report metadata (title, project name, etc.)
 * @param {string} filename - Name for the downloaded file
 */
export const generateWordDocument = async (html, metadata, filename) => {
  try {
    console.log('Generating Word document');
    
    // Create document with proper sections
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              font: "Arial",
              size: 24,
            },
            paragraph: {
              spacing: {
                line: 276, // 1.15x line spacing
              },
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            run: {
              font: "Arial",
              size: 32,
              bold: true,
            },
            paragraph: {
              spacing: {
                before: 240,
                after: 120,
              },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            run: {
              font: "Arial",
              size: 28,
              bold: true,
            },
            paragraph: {
              spacing: {
                before: 240,
                after: 120,
              },
            },
          },
        ],
      },
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: metadata.title || 'Contract Assistant Report',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            
            // Project info if available
            ...(metadata.projectName ? [
              new Paragraph({
                text: `Project: ${metadata.projectName}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 }
              })
            ] : []),
            
            // Date
            new Paragraph({
              children: [
                new TextRun({
                  text: `Date: ${new Date().toLocaleDateString()}`,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 400 }
            }),
            
            // Main content
            ...createDocumentParagraphs(html),
            
            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Generated by Contract Assistant',
                  font: "Arial",
                  size: 20,
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 }
            })
          ]
        }
      ]
    });
    
    // Generate and save document
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${filename || 'contract-assistant-document'}.docx`);
    
    return true;
  } catch (error) {
    console.error('Error generating Word document:', error);
    Sentry.captureException(error, {
      extra: {
        context: 'Word document generation',
        metadata
      }
    });
    return false;
  }
};

/**
 * Generate a simple Word document from plain text
 * @param {string} text - Plain text content
 * @param {string} title - Document title
 * @param {string} filename - Name for the downloaded file
 */
export const generateSimpleWordDocument = async (text, title, filename) => {
  try {
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              font: "Arial",
              size: 24,
            },
            paragraph: {
              spacing: {
                line: 276, // 1.15x line spacing
              },
            },
          },
        ],
      },
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title || 'Contract Assistant Document',
                  font: "Arial",
                  size: 32,
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 }
            }),
            
            ...text.split('\n\n').map(paragraph => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph.trim(),
                    font: "Arial",
                    size: 24,
                  }),
                ],
                spacing: { after: 200 }
              })
            )
          ]
        }
      ]
    });
    
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${filename || 'contract-assistant-document'}.docx`);
    
    return true;
  } catch (error) {
    console.error('Error generating simple Word document:', error);
    Sentry.captureException(error);
    return false;
  }
};