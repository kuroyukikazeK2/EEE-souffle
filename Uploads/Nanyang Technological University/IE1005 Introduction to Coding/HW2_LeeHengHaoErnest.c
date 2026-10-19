#include <stdio.h>

int main (void)  // start of main function
{
    // declaring the looping function to be used later
    double cycle (int c, double ctemp, int fan);  

    // declaration of local variables 
    double c0temp = 30;  // declare and initialize core 0 temp vairable as 30 
    double c1temp = 30;  // declare and initialize core 1 temp vairable as 30 
    
    // Settings & other variables
    int fan, cycles; // declaration of fan tier (fan; user input), number of cycles (cycles, user input)
    int throttled = 0; // declaration of x times the device throttled 
    int c_ran = 0; // variable for number of cycles ran

    //declaring of workload variables 
    int c0, c1; // workload of c0 and c1

    //output message variables 
    char safety[] = "Safe Completion";
    char danger[] = "Emergency Shutdown";

    //prints header that takes user input 
    printf("=== CPU Thermal Controller Simulation ===\n\n");
    printf("Enter number of cycles: ");
    scanf("%d", &cycles);
    printf("Enter Fan Tier (1-3): ");
    scanf("%d", &fan);
    
    // Simulation loop (For loop) for total number of cycles this is supposed to loop
    int shutdown = 0; // for shutdown later
    for (int i = 1; i <= cycles; i++){
        printf("\n--- Cycle %d ---\n", i);
        printf("Enter workloads for Core 0 and Core 1 (0-100): ");
        scanf("%d %d", &c0, &c1);

        //compute 
        c0temp = cycle(c0, c0temp, fan);
        c1temp = cycle(c1, c1temp, fan);
        c_ran++; //increment number of cycles for everytime this function is run
        
        // display updated core, to 2 d.p
        printf("Core 0: %.2f | Core 1: %.2f", c0temp, c1temp);

        // logic parameters for checking thermal throttling.
        // either core rch or exceed 85, execute the following
        if (c0temp >= 85 || c1temp >= 85) { 
            
            // logic parameters for checking emergency shutdown 
            // if both core exceed 95, execute the following
             if (c1temp >95 && c0temp > 95){ 
                printf("\n[CRITICAL] %s!\n", danger);
                throttled++; // throttled count increases 
                shutdown = 1;
                break; // breaks the for loop
            } 
            
            // for the thermal throttling loop, adds throttled cycles
            else {
                printf("\n[ALERT] Thermal Throttling Active!\n"); // execute when either core rch or exceed 85
                throttled++; // throttled count increases 
            }
        } 
        
        // if no thermal throttle, add space        
        else {
            printf("\n");
        }
    }
    
    //prints table end (summary)
    printf("\n=== Diagnostic Summary ===\n");
    
    //prints a diff msg depending on whether shutdown happened 
    if (shutdown == 1){
        printf("System Status      : %s (Cycle %d)\n", danger, c_ran);
    } else {
        printf("System Status      : %s\n", safety);
    }

    printf("Total Cycles Run   : %d\n", c_ran); // total cycles ran 
    printf("Throttled Cycles   : %d\n", throttled); // throttled count
    printf("Final Temperatures : Core 0: %.2f | Core 1: %.2f", c0temp, c1temp); // both core temp

    return 0;
}

// cycle core function 
double cycle (int c, double ctemp, int fan) {

    // c = workload, ctemp = temp
    double delta, net;

    // basic logic for temperature change based on heat generation 
    if (c < 30) {
        delta = 2; // temp increases by 2 if workload < 30
    } else if (30 <= c && c <= 70) {
        delta = 0.15 * c; // temp increases by factor of 0.15* workload if workload >= 30, but  <= 70
    } else if (c > 70) {
        delta = 0.25 * c; // temp increases by factor of 0.25* workload if workload > 70
    }

    //check for thermal runway 
    if (ctemp >= 85){
            delta = delta * 1.2; //if temp >= 85, further increase temp change by 1.2 factor
    }

    // basic logic for temperature change based on active cooling
    if (fan == 1) {
        net = ctemp + delta - 4; // fan cooling temp based on tier. Tier 1 = 4
    } else if (fan == 2) {
        net = ctemp + delta - 9; // fan cooling temp based on tier. Tier 2 = 9
    } else if (fan == 3) {
        net = ctemp + delta - 16; // fan cooling temp based on tier. Tier 3 = 16
    }

    // return values, but also cap off temp at 30 
    if (net < 30) {
        ctemp = 30;
    } else {
        ctemp = net;
    }
    
    return ctemp;
}