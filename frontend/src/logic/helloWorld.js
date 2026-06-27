/**
 * Hello World snippets for common programming languages.
 */

export const LANGUAGES = [
  {
    key: 'javascript',
    name: 'JavaScript',
    aliases: ['js'],
    description: '运行在浏览器和 Node.js 中的脚本语言。',
    code: "console.log('Hello, World!');"
  },
  {
    key: 'typescript',
    name: 'TypeScript',
    aliases: ['ts'],
    description: 'JavaScript 的超集，添加了静态类型系统。',
    code: "const message: string = 'Hello, World!';\nconsole.log(message);"
  },
  {
    key: 'python',
    name: 'Python',
    aliases: ['py'],
    description: '以简洁著称的高级编程语言。',
    code: "print('Hello, World!')"
  },
  {
    key: 'c',
    name: 'C',
    aliases: [],
    description: '经典的系统级编程语言。',
    code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
  },
  {
    key: 'cpp',
    name: 'C++',
    aliases: ['c++'],
    description: '在 C 语言基础上增加了面向对象特性。',
    code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
  },
  {
    key: 'csharp',
    name: 'C#',
    aliases: ['cs'],
    description: '微软开发的现代面向对象语言。',
    code: 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello, World!");\n    }\n}'
  },
  {
    key: 'java',
    name: 'Java',
    aliases: [],
    description: '跨平台的面向对象编程语言。',
    code: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
  },
  {
    key: 'go',
    name: 'Go',
    aliases: ['golang'],
    description: 'Google 开发的高性能系统语言。',
    code: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
  },
  {
    key: 'rust',
    name: 'Rust',
    aliases: [],
    description: '注重安全与性能的系统编程语言。',
    code: 'fn main() {\n    println!("Hello, World!");\n}'
  },
  {
    key: 'ruby',
    name: 'Ruby',
    aliases: ['rb'],
    description: '注重开发者幸福感的动态语言。',
    code: "puts 'Hello, World!'"
  },
  {
    key: 'php',
    name: 'PHP',
    aliases: [],
    description: '广泛用于 Web 开发的服务器端脚本语言。',
    code: "<?php\necho 'Hello, World!';\n?>"
  },
  {
    key: 'swift',
    name: 'Swift',
    aliases: [],
    description: 'Apple 开发的现代编程语言。',
    code: "print(\"Hello, World!\")"
  },
  {
    key: 'kotlin',
    name: 'Kotlin',
    aliases: ['kt'],
    description: 'JetBrains 开发的现代 JVM 语言。',
    code: "fun main() {\n    println(\"Hello, World!\")\n}"
  },
  {
    key: 'bash',
    name: 'Bash',
    aliases: ['sh', 'shell'],
    description: 'Linux/Unix 系统常用脚本语言。',
    code: "echo 'Hello, World!'"
  },
  {
    key: 'html',
    name: 'HTML',
    aliases: [],
    description: '网页结构标记语言。',
    code: '<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello, World!</h1>\n  </body>\n</html>'
  },
  {
    key: 'css',
    name: 'CSS',
    aliases: [],
    description: '网页样式描述语言。',
    code: 'body::before {\n    content: "Hello, World!";\n}'
  },
  {
    key: 'sql',
    name: 'SQL',
    aliases: [],
    description: '结构化查询语言。',
    code: "SELECT 'Hello, World!';"
  },
  {
    key: 'lua',
    name: 'Lua',
    aliases: [],
    description: '轻量级嵌入式脚本语言。',
    code: "print('Hello, World!')"
  },
  {
    key: 'perl',
    name: 'Perl',
    aliases: [],
    description: '以文本处理见长的脚本语言。',
    code: "print 'Hello, World!\\n';"
  },
  {
    key: 'r',
    name: 'R',
    aliases: [],
    description: '统计计算与数据可视化语言。',
    code: 'print("Hello, World!")'
  },
  {
    key: 'matlab',
    name: 'MATLAB',
    aliases: [],
    description: '矩阵计算与数值分析环境。',
    code: "disp('Hello, World!')"
  }
]

/**
 * Find a language by key or alias.
 * @param {string} key
 * @returns {{key: string, name: string, aliases: string[], description: string, code: string}|undefined}
 */
export function findLanguage(key) {
  const input = String(key || '').toLowerCase().trim()
  return LANGUAGES.find(
    lang => lang.key === input || lang.aliases.includes(input)
  )
}

/**
 * Get the display label for a language.
 * @param {string} key
 * @returns {string}
 */
export function getLanguageName(key) {
  const lang = findLanguage(key)
  return lang ? lang.name : key
}
