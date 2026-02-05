#include <emscripten/emscripten.h>
#include <iostream>
#include <vector>

class Row {
   public:
    Row(int cols) : numberOfCols(cols) {
        elements.resize(cols, 0.0);
    }

    void setElement(int index, double value) {
        if (index >= 0 && index < numberOfCols) {
            elements[index] = (value == -0.0) ? 0.0 : value;
        }
    }

    double getElement(int index) const {
        if (index >= 0 && index < numberOfCols) {
            return (elements[index] == -0.0) ? 0.0 : elements[index];
        }
        return 0.0;
    }

    int getLeadingColumn() const {
        for (int column = 0; column < numberOfCols; ++column) {
            if (elements[column] != 0) {
                return column;
            }
        }
        return numberOfCols;
    }

    double getLeadingValue() const {
        int leadingColumn = getLeadingColumn();
        if (leadingColumn < numberOfCols) {
            return elements[leadingColumn];
        }
        return 1.0;
    }

    void reduce(double reducer) {
        if (reducer == 0) return;
        for (int i = 0; i < numberOfCols; ++i) {
            elements[i] = elements[i] / reducer;
        }
    }

   private:
    int numberOfCols;
    std::vector<double> elements;
};

class Matrix {
   public:
    Matrix(int rows, int cols) : numberOfRows(rows), numberOfCols(cols) {
        for (int i = 0; i < numberOfRows; ++i) {
            matrix.emplace_back(numberOfCols);
        }
    }

    void setElement(int r, int c, double val) {
        if (r >= 0 && r < numberOfRows) {
            matrix[r].setElement(c, val);
        }
    }

    double getElement(int r, int c) const {
        if (r >= 0 && r < numberOfRows) {
            return matrix[r].getElement(c);
        }
        return 0.0;
    }

    void reduce() {
        int reducedRows = 0;
        int reducedColumns = 0;
        for (int column = 0; column < numberOfCols && reducedRows < numberOfRows; ++column) {
            int pivotRow = -1;
            for (int row = reducedRows; row < numberOfRows; ++row) {
                if (matrix[row].getElement(column) != 0) {
                    pivotRow = row;
                    break;
                }
            }

            if (pivotRow != -1) {
                // Swap current row with pivot row
                if (pivotRow != reducedRows) {
                    std::swap(matrix[reducedRows], matrix[pivotRow]);
                }

                // Normalize pivot row
                double leadingValue = matrix[reducedRows].getElement(column);
                matrix[reducedRows].reduce(leadingValue);

                // Eliminate other rows
                for (int row = 0; row < numberOfRows; ++row) {
                    if (row != reducedRows) {
                        double leadingValueOther = matrix[row].getElement(column);
                        for (int c = 0; c < numberOfCols; ++c) {
                            double val = matrix[row].getElement(c) - (matrix[reducedRows].getElement(c) * leadingValueOther);
                            matrix[row].setElement(c, val);
                        }
                    }
                }
                reducedRows++;
            }
        }
    }

   private:
    int numberOfRows;
    int numberOfCols;
    std::vector<Row> matrix;
};

extern "C" {

    EMSCRIPTEN_KEEPALIVE
    void rref(double* data, int rows, int cols) {
        Matrix m(rows, cols);
        
        // Load data into matrix
        for (int i = 0; i < rows; ++i) {
            for (int j = 0; j < cols; ++j) {
                m.setElement(i, j, data[i * cols + j]);
            }
        }

        // Perform reduction
        m.reduce();

        // Write data back to the pointer
        for (int i = 0; i < rows; ++i) {
            for (int j = 0; j < cols; ++j) {
                data[i * cols + j] = m.getElement(i, j);
            }
        }
    }
}