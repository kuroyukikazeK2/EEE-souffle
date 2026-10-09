#include <stdio.h>

int main () {

    /* Declaration of variables,
    marks of each student to be stored in variables stu1, stu2, and stu3 */
    int stu1, stu2, stu3;
    // Declaration of grade variables
    char A, B, C;

    //declaration of functions,
    char grade(int mark); // function to calculate the grade of each student based on their marks
    void tablestart(); // function to print the header of the table
    void tableend(); // function to print the bottom of the table

    // Prompts user to key in the marks of 3 students
    printf("Enter the integer marks of 3 students (e.g. 35 89 53):");
    // using scanf function, stores user input into variables stu1, stu2, and stu3
    scanf("%d %d %d", &stu1, &stu2, &stu3);

    //call function grade to evaluate the scores 
    A = grade(stu1); // insert stu1 into grade function, store it in A
    B = grade(stu2); // insert stu2 into grade function, store it in B
    C = grade(stu3); // insert stu3 into grade function, store it in C

    // Prints the table
    tablestart();
    
    // Prints the table of marks and grades of each student
    printf("Student 1     %d         %c\n", stu1, A);
    printf("Student 2     %d         %c\n", stu2, B);
    printf("Student 3     %d         %c\n", stu3, C);

    tableend();
    //end of program
    return 0;
}

void tablestart (){
    // Prints the header of the table
    printf("===============================\n");
    printf("Student       Mark       Grade\n");
    printf("-------------------------------\n");
}

void tableend (){
    // Prints the bottom of the table
    printf("===============================\n");
}

char grade (int mark){
    // Calculates the grade of each student based off their mark input
    // 80 to 100 marks is A
    // 50 to 79 is B
    // 0 to 49 is C
    // We can try to obtain and print the ASCII value of the grade

    int r1 = (mark >= 50); // >50 gives 1, <50 gives 0)
    int r2 = mark/80; // >80 gives 1, <80 gives 0

    // since A is 65, B is 66, C is 67, the formula is as follows
    char grade = 67 - (r1+r2);

    //parse and return the number as a character, in the appropriate ASCII value
    return grade;
}

