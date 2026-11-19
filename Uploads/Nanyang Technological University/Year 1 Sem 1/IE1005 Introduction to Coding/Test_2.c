#include <stdio.h>
#include <math.h>

void main (void){

    double WCImath (double tmin, double tmax, double tstep, double vmin, double vmax, double vstep);
    double tmin, tmax, tstep;
    double vmin, vmax, vstep;

    //headers
    printf ("*** WCI Climate Index ***\n");

    printf("Enter Tmin, Tmax, Tstep (degC): ");
    scanf("%lf %lf %lf", &tmin, &tmax, &tstep);
    printf("Enter Vmin, Vmax, Vstep: ");
    scanf("%lf %lf %lf", &vmin, &vmax, &vstep);

    if (tmin > 10 || tmax > 10) {
        printf("Temperature too high, WCI cannot happen")
    } else {
        if (vmin <= 4.8 || vmax <= 4.8){
            printf("Wind Speed too high, WCI cannot happen")
        } else {
            WCImath(tmin, tmax, tstep, vmin, vmax, vstep);
        }
    }
    return;
}

double WCImath (double tmin, double tmax, double tstep, double vmin, double vmax, double vstep) {

    double math (float temp, float v);
    int p = (tmax - tmin) / tstep;
    int k = (vmax - vmin) / vstep;

    // header row
    printf("%-12s", "WCI");
    for (int j = 0; j <= k; j++) {
        double v = vmin + j * vstep;
        printf("  v =%5.1f", v);          // 10 chars per column
    }
    printf("\n");

    // data rows: one loop, one format
    for (int i = 0; i <= p; i++) {
        double temp = tmin + i * tstep;

        // label column is always 12 chars; "T =" only on the first row
        printf("%-4s%-8.1f", (i == 0) ? "T =" : "", temp);

        for (int j = 0; j <= k; j++) {
            double v = vmin + j * vstep;
            printf("%10.1f", math(temp, v));   // same 10 chars as the header
        }
        printf("\n");
    }
    return 0;
}

double math (float temp, float v){
    double WCI = 13.127 + (0.6215*temp) - (11.362*pow(v,0.16)) + (0.3965*temp*pow(v,0.16));
    return WCI;
}