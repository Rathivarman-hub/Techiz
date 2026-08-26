import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Question from './models/Question.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@techiz.com';
const ADMIN_PASSWORD = 'Admin@123';

const sampleQuestions = [
  // ===== PYTHON (10 questions: 4 MCQ, 3 Output, 2 Syntax, 1 Error) =====
  // MCQ
  { language: 'python', type: 'mcq', question: 'Which of the following is a mutable data type in Python?', options: ['tuple', 'string', 'list', 'frozenset'], answer: 'list', difficulty: 'easy' },
  { language: 'python', type: 'mcq', question: 'What does the `len()` function return?', options: ['Data type', 'Memory address', 'Number of elements', 'Sum of elements'], answer: 'Number of elements', difficulty: 'easy' },
  { language: 'python', type: 'mcq', question: 'Which keyword is used to define a function in Python?', options: ['func', 'define', 'def', 'function'], answer: 'def', difficulty: 'easy' },
  { language: 'python', type: 'mcq', question: 'What is the output of `2 ** 3` in Python?', options: ['6', '8', '9', '5'], answer: '8', difficulty: 'easy' },
  // Output
  { language: 'python', type: 'output', question: 'What is the output of the following code?', codeSnippet: 'x = [1, 2, 3]\nprint(x[::-1])', options: ['[1, 2, 3]', '[3, 2, 1]', '[2, 3, 1]', 'Error'], answer: '[3, 2, 1]', difficulty: 'easy' },
  { language: 'python', type: 'output', question: 'What is the output?', codeSnippet: 'print(type(5.0))', options: ['<class int>', "<class 'float'>", "<class 'int'>", 'float'], answer: "<class 'float'>", difficulty: 'easy' },
  { language: 'python', type: 'output', question: 'What is the output?', codeSnippet: 'd = {"a": 1, "b": 2}\nprint(list(d.keys()))', options: ['["a", "b"]', '["1", "2"]', '[a, b]', 'Error'], answer: '["a", "b"]', difficulty: 'easy' },
  // Syntax
  { language: 'python', type: 'syntax', question: 'Identify the syntax error:', codeSnippet: 'def greet(name)\n    print("Hello", name)', options: ['Missing colon after def greet(name)', 'Wrong print syntax', 'Missing quotes', 'Indentation error'], answer: 'Missing colon after def greet(name)', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'Missing colon after function definition. Python requires a colon (:) after the function signature.', correctCode: 'def greet(name):\n    print("Hello", name)', learningTip: 'Always end function definitions with a colon. This applies to if, for, while, and class definitions too.' },
  { language: 'python', type: 'syntax', question: 'What is wrong with this code?', codeSnippet: 'if x = 10:\n    print(x)', options: ['Should use == not =', 'Missing colon', 'Print error', 'x not defined'], answer: 'Should use == not =', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'Using assignment operator (=) instead of comparison operator (==) in conditional. The = operator assigns a value, while == compares two values.', correctCode: 'if x == 10:\n    print(x)', learningTip: 'Use == for comparison and = for assignment. Remember: single equals (=) assigns, double equals (==) compares.' },
  // Error Detection
  { language: 'python', type: 'error', question: 'What error occurs in this code?', codeSnippet: 'lst = [1, 2, 3]\nprint(lst[5])', options: ['Index Out Of Bounds Exception', 'Reference Error', 'Type Error', 'No error'], answer: 'Index Out Of Bounds Exception', difficulty: 'easy', errorType: 'Index Out Of Bounds Exception', errorExplanation: 'The list has only 3 elements (indices 0, 1, 2), but the code tries to access index 5 which does not exist.', correctCode: 'lst = [1, 2, 3]\nprint(lst[2])  # Valid index', learningTip: 'Always remember that list indices start at 0 and go up to length-1. Use len(lst) to find the maximum valid index.' },

// ===== JAVASCRIPT (10 questions: 4 MCQ, 3 Output, 2 Syntax, 1 Error) =====
  // MCQ
  { language: 'javascript', type: 'mcq', question: 'Which keyword declares a block-scoped variable in JavaScript?', options: ['var', 'let', 'const', 'Both let and const'], answer: 'Both let and const', difficulty: 'easy' },
  { language: 'javascript', type: 'mcq', question: 'What does `typeof null` return?', options: ['null', 'undefined', 'object', 'boolean'], answer: 'object', difficulty: 'easy' },
  { language: 'javascript', type: 'mcq', question: 'Which method converts a JSON string to a JS object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.decode()'], answer: 'JSON.parse()', difficulty: 'easy' },
  { language: 'javascript', type: 'mcq', question: 'What does `===` check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], answer: 'Value and type', difficulty: 'easy' },
  // Output
  { language: 'javascript', type: 'output', question: 'What is the output?', codeSnippet: 'console.log(0.1 + 0.2 === 0.3);', options: ['true', 'false', 'undefined', 'Error'], answer: 'false', difficulty: 'easy' },
  { language: 'javascript', type: 'output', question: 'What is the output?', codeSnippet: 'let x = 5;\nconsole.log(x++);', options: ['6', '5', '4', 'undefined'], answer: '5', difficulty: 'easy' },
  { language: 'javascript', type: 'output', question: 'What is logged?', codeSnippet: 'const arr = [1, 2, 3];\nconsole.log(arr.map(x => x * 2));', options: ['[1, 2, 3]', '[2, 4, 6]', '[3, 6, 9]', 'Error'], answer: '[2, 4, 6]', difficulty: 'easy' },
  // Syntax
  { language: 'javascript', type: 'syntax', question: 'Identify the error:', codeSnippet: 'function add(a, b) {\n  return a + b\n}\nconsole.log(add(2 3));', options: ['Missing comma between 2 and 3', 'Missing return type', 'Missing semicolon', 'Wrong function name'], answer: 'Missing comma between 2 and 3', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'Function call is missing a comma between the two arguments. JavaScript requires commas to separate function parameters.', correctCode: 'console.log(add(2, 3));', learningTip: 'Always separate function arguments with commas. This syntax error will prevent the code from running.' },
  { language: 'javascript', type: 'syntax', question: 'What is wrong?', codeSnippet: 'const obj = {\n  name: "Alice"\n  age: 25\n};', options: ['Missing comma after name property', 'Missing semicolons', 'Wrong quotes', 'No error'], answer: 'Missing comma after name property', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'Object properties must be separated by commas. Missing the comma after the name property causes a syntax error.', correctCode: 'const obj = {\n  name: "Alice",\n  age: 25\n};', learningTip: 'In objects, always use commas to separate properties. Remember: properties require commas, but the last property does not have a trailing comma (though modern JS allows it).' },
  // Error Detection
  { language: 'javascript', type: 'error', question: 'What error occurs in this code?', codeSnippet: 'const arr = [1, 2, 3];\nconsole.log(arr[10]);', options: ['Index Out Of Bounds Exception', 'Reference Error', 'Type Error', 'No error'], answer: 'No error', difficulty: 'easy', errorType: 'No Runtime Error', errorExplanation: 'JavaScript does not throw an error for out-of-bounds array access. Instead, it returns undefined. This is different from languages like Java.', correctCode: 'const arr = [1, 2, 3];\nconsole.log(arr[10]); // prints: undefined', learningTip: 'JavaScript arrays don\'t throw errors for invalid indices—they return undefined. Always check array bounds or use try-catch for safety.' },

  // ===== JAVA (10 questions: 4 MCQ, 3 Output, 2 Syntax, 1 Error) =====
  // MCQ
  { language: 'java', type: 'mcq', question: 'Which keyword is used to inherit a class in Java?', options: ['implements', 'extends', 'inherits', 'super'], answer: 'extends', difficulty: 'easy' },
  { language: 'java', type: 'mcq', question: 'What is the default value of an int variable in Java?', options: ['null', '0', '1', 'undefined'], answer: '0', difficulty: 'easy' },
  { language: 'java', type: 'mcq', question: 'Which method is the entry point of a Java program?', options: ['start()', 'run()', 'main()', 'init()'], answer: 'main()', difficulty: 'easy' },
  { language: 'java', type: 'mcq', question: 'Which data type is used to store a single character in Java?', options: ['String', 'char', 'character', 'byte'], answer: 'char', difficulty: 'easy' },
  // Output
  { language: 'java', type: 'output', question: 'What is the output?', codeSnippet: 'System.out.println(10 / 3);', options: ['3.33', '3', '4', 'Error'], answer: '3', difficulty: 'easy' },
  { language: 'java', type: 'output', question: 'What is the output?', codeSnippet: 'String s = "Hello";\nSystem.out.println(s.length());', options: ['4', '5', '6', 'Error'], answer: '5', difficulty: 'easy' },
  { language: 'java', type: 'output', question: 'What is the output?', codeSnippet: 'boolean b = true;\nSystem.out.println(!b);', options: ['true', 'false', '0', 'Error'], answer: 'false', difficulty: 'easy' },
  // Syntax
  { language: 'java', type: 'syntax', question: 'Identify the error:', codeSnippet: 'public class Main {\n  public static void main(String args[]) {\n    System.out.println("Hello")\n  }\n}', options: ['Missing semicolon after println', 'Wrong class name', 'Missing brackets', 'No error'], answer: 'Missing semicolon after println', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'Every Java statement must end with a semicolon. The println statement is missing the required semicolon.', correctCode: 'System.out.println("Hello");', learningTip: 'In Java, every statement must end with a semicolon (;). This is one of the most common syntax errors in Java.' },
  { language: 'java', type: 'syntax', question: 'What is wrong?', codeSnippet: 'for (int i = 0 i < 5; i++) {\n    System.out.println(i);\n}', options: ['Missing semicolon after i = 0', 'Wrong loop syntax', 'Missing closing brace', 'No error'], answer: 'Missing semicolon after i = 0', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'The for loop initialization (int i = 0) must be followed by a semicolon before the condition (i < 5).', correctCode: 'for (int i = 0; i < 5; i++) {\n    System.out.println(i);\n}', learningTip: 'For loops in Java require three parts separated by semicolons: initialization; condition; increment. Each part must be properly separated.' },
  // Error Detection
  { language: 'java', type: 'error', question: 'What error occurs in this code?', codeSnippet: 'int[] arr = {1, 2, 3};\nSystem.out.println(arr[5]);', options: ['Index Out Of Bounds Exception', 'Reference Error', 'Type Error', 'No error'], answer: 'Index Out Of Bounds Exception', difficulty: 'easy', errorType: 'Index Out Of Bounds Exception', errorExplanation: 'The array has only 3 elements with valid indices 0, 1, and 2. Accessing index 5 causes an ArrayIndexOutOfBoundsException at runtime.', correctCode: 'int[] arr = {1, 2, 3};\nSystem.out.println(arr[2]); // Correct: prints 3', learningTip: 'Arrays in Java have fixed sizes. Always check the array length before accessing elements. Use array.length to get the number of elements.' },

  // ===== C (10 questions: 4 MCQ, 3 Output, 2 Syntax, 1 Error) =====
  // MCQ
  { language: 'c', type: 'mcq', question: 'Which header file is required for printf() and scanf() in C?', options: ['string.h', 'math.h', 'stdio.h', 'stdlib.h'], answer: 'stdio.h', difficulty: 'easy' },
  { language: 'c', type: 'mcq', question: 'What is the size of `char` in C?', options: ['2 bytes', '4 bytes', '1 byte', '8 bytes'], answer: '1 byte', difficulty: 'easy' },
  { language: 'c', type: 'mcq', question: 'Which operator is used to access members of a structure through a pointer?', options: ['.', '->', '::', '*'], answer: '->', difficulty: 'easy' },
  { language: 'c', type: 'mcq', question: 'What does `malloc()` return if memory allocation fails?', options: ['0', 'NULL', '-1', 'undefined'], answer: 'NULL', difficulty: 'easy' },
  // Output
  { language: 'c', type: 'output', question: 'What is the output?', codeSnippet: '#include<stdio.h>\nint main() {\n    printf("%d", 5/2);\n    return 0;\n}', options: ['2.5', '2', '3', 'Error'], answer: '2', difficulty: 'easy' },
  { language: 'c', type: 'output', question: 'What is the output?', codeSnippet: '#include<stdio.h>\nint main() {\n    int x = 10;\n    printf("%d", x++);\n    return 0;\n}', options: ['11', '10', '9', 'Error'], answer: '10', difficulty: 'easy' },
  { language: 'c', type: 'output', question: 'What is the output?', codeSnippet: '#include<stdio.h>\nint main() {\n    printf("%c", 65);\n    return 0;\n}', options: ['65', 'A', 'a', 'Error'], answer: 'A', difficulty: 'easy' },
  // Syntax
  { language: 'c', type: 'syntax', question: 'Identify the error:', codeSnippet: '#include<stdio.h>\nvoid main() {\n    int x = 10\n    printf("%d", x);\n}', options: ['Missing semicolon after x = 10', 'Wrong include', 'Wrong printf', 'No error'], answer: 'Missing semicolon after x = 10', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'Every statement in C must end with a semicolon. The assignment statement "int x = 10" is missing the required semicolon.', correctCode: 'int x = 10;', learningTip: 'In C, every statement must terminate with a semicolon (;). This prevents compilation errors.' },
  { language: 'c', type: 'syntax', question: 'What is wrong?', codeSnippet: '#include <stdio.h>\nint main( {\n    printf("Hello");\n    return 0;\n}', options: ['Missing closing parenthesis in main()', 'Wrong include', 'Missing semicolon', 'No error'], answer: 'Missing closing parenthesis in main()', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'The main function declaration is incomplete. It should be "int main() {" with both opening and closing parentheses.', correctCode: 'int main() {', learningTip: 'Function declarations require parentheses even if there are no parameters. main() must be declared with parentheses: int main()' },
  // Error Detection
  { language: 'c', type: 'error', question: 'What error occurs in this code?', codeSnippet: 'int arr[5] = {1, 2, 3, 4, 5};\nprintf("%d", arr[5]);', options: ['Index Out Of Bounds Exception', 'Compilation Error', 'Runtime Error', 'No error'], answer: 'Runtime Error', difficulty: 'easy', errorType: 'Index Out Of Bounds Exception', errorExplanation: 'The array has only 5 elements with valid indices 0-4. Accessing index 5 is out of bounds and results in undefined behavior.', correctCode: 'printf("%d", arr[4]); // Correct: prints the last element', learningTip: 'Array indices in C start at 0. For an array of size n, valid indices are 0 to n-1. C does not check bounds at runtime, so this can cause crashes.' },

  // ===== C++ (10 questions: 4 MCQ, 3 Output, 2 Syntax, 1 Error) =====
  // MCQ
  { language: 'cpp', type: 'mcq', question: 'Which feature of OOP allows a class to inherit from multiple classes?', options: ['Encapsulation', 'Polymorphism', 'Multiple Inheritance', 'Abstraction'], answer: 'Multiple Inheritance', difficulty: 'easy' },
  { language: 'cpp', type: 'mcq', question: 'What is the correct way to declare a reference variable in C++?', options: ['int &x = y;', 'int *x = y;', 'ref int x = y;', 'int x = &y;'], answer: 'int &x = y;', difficulty: 'easy' },
  { language: 'cpp', type: 'mcq', question: 'Which operator is used for dynamic memory allocation in C++?', options: ['malloc', 'new', 'alloc', 'create'], answer: 'new', difficulty: 'easy' },
  { language: 'cpp', type: 'mcq', question: 'Which header file is used for input/output in C++?', options: ['stdio.h', 'iostream', 'string.h', 'cstdio'], answer: 'iostream', difficulty: 'easy' },
  // Output
  { language: 'cpp', type: 'output', question: 'What is the output?', codeSnippet: '#include<iostream>\nusing namespace std;\nint main() {\n    cout << 10 / 3 << endl;\n    return 0;\n}', options: ['3.33', '3', '4', 'Error'], answer: '3', difficulty: 'easy' },
  { language: 'cpp', type: 'output', question: 'What is the output?', codeSnippet: '#include<iostream>\nusing namespace std;\nint main() {\n    int x = 5;\n    cout << ++x << endl;\n    return 0;\n}', options: ['5', '6', '4', 'Error'], answer: '6', difficulty: 'easy' },
  { language: 'cpp', type: 'output', question: 'What is the output?', codeSnippet: '#include<iostream>\nusing namespace std;\nint main() {\n    bool x = true;\n    cout << !x << endl;\n}', options: ['true', 'false', '1', '0'], answer: '0', difficulty: 'easy' },
  // Syntax
  { language: 'cpp', type: 'syntax', question: 'Identify the error:', codeSnippet: '#include<iostream>\nusing namespace std\nint main() {\n    cout << "Hello";\n    return 0;\n}', options: ['Missing semicolon after namespace std', 'Missing include', 'Wrong main syntax', 'No error'], answer: 'Missing semicolon after namespace std', difficulty: 'easy', errorType: 'Syntax Error', errorExplanation: 'The using directive "using namespace std" must end with a semicolon, just like any other statement in C++.', correctCode: 'using namespace std;', learningTip: 'All C++ statements and directives must end with a semicolon, including using statements.' },
  { language: 'cpp', type: 'syntax', question: 'What is wrong?', codeSnippet: 'int main() {\n    vector<int> v;\n    v.push_back(1);\n    cout << v[0];\n}', options: ['Missing #include<vector> and #include<iostream>', 'Wrong vector syntax', 'Missing return', 'No error'], answer: 'Missing #include<vector> and #include<iostream>', difficulty: 'easy', errorType: 'Compilation Error', errorExplanation: 'The code uses vector and cout without including the necessary headers. vector requires #include<vector> and cout requires #include<iostream>.', correctCode: '#include<iostream>\n#include<vector>\nusing namespace std;', learningTip: 'Always include necessary headers for the libraries and functions you use. vector, iostream, string, etc., all require specific headers.' },
  // Error Detection
  { language: 'cpp', type: 'error', question: 'What error occurs in this code?', codeSnippet: 'vector<int> v;\nv.push_back(1);\nv.push_back(2);\ncout << v[5];', options: ['Index Out Of Bounds Exception', 'Reference Error', 'Type Error', 'No error'], answer: 'No error', difficulty: 'easy', errorType: 'Undefined Behavior', errorExplanation: 'C++ STL vectors do not perform bounds checking by default. Accessing out-of-bounds indices causes undefined behavior but no exception.', correctCode: 'cout << v.at(1); // Use at() for bounds checking', learningTip: 'Use the at() method on vectors for bounds-checked access. Direct index access [] does not check bounds and can cause crashes.' },
];

async function seed() {
  try {
    // Step 1: Connect to Database
    await connectDB();

    // Step 2: Create Admin User
    console.log('\n📝 Processing admin user...');
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({ 
        name: 'Techiz Admin', 
        email: ADMIN_EMAIL, 
        password: hashedPassword, 
        role: 'admin' 
      });
      console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
    } else {
      console.log(`ℹ️  Admin already exists (${ADMIN_EMAIL})`);
    }

    // Step 3: Seed Questions
    console.log('\n📚 Processing questions...');
    const existing = await Question.countDocuments();
    if (existing === 0) {
      await Question.insertMany(sampleQuestions);
      console.log(`✅ Seeded ${sampleQuestions.length} questions`);
      console.log(`   • Python: 10 questions`);
      console.log(`   • JavaScript: 10 questions`);
      console.log(`   • Java: 10 questions`);
      console.log(`   • C: 10 questions`);
      console.log(`   • C++: 10 questions`);
    } else {
      console.log(`ℹ️  Questions already exist (${existing} found). Skipping.`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('✨ Database is ready to use.\n');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Seeding Error:', err.message);
    if (err.writeErrors) {
      console.error('Write Errors:', err.writeErrors);
    }
    process.exit(1);
  }
}

seed();
