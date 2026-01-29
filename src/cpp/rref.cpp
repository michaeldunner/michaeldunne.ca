#include <emscripten/emscripten.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int multiply(int a, int b) {
        return a * b;
    }
}