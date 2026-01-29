"use client";
import { Code } from "./code";

export function RREF() {
  return (
    <Code
      title="#130 The Atrocious"
      subtitle="Gyarados"
      date="2026-01-06"
      code={`#include <iostream>
#include <vector>

int main() {
    class Row {
       public:
        Row(int cols) {
            numberOfCols = cols;
        }

        void createRow() {
            for (int column = 0; column < numberOfCols; ++column) {
                double value;
                std::cin >> value;
                elements.push_back(value);
            }
        }

        void setElement(int index, double value) {
            if (value == -0) {
                value = 0;
            }
            elements[index] = value;
        }

        double getElement(int index) {
            if (elements[index] == -0) {
                elements[index] = 0;
            }
            return elements[index];
        }

        int getLeadingColumn() {
            for (int column = 0; column < numberOfCols; ++column) {
                if (elements[column] != 0) {
                    return column;
                }
            }
            return numberOfCols;
        }

        double getLeadingValue() {
            int leadingColumn = getLeadingColumn();
            return elements[leadingColumn];
        }

        void reduce(double reducer) {
            for (int i = 0; i < numberOfCols; ++i) {
                elements[i] = elements[i] / reducer;
            }
            return;
        }

       private:
        int numberOfCols;
        std::vector<double> elements;
    };

    class Matrix {
       public:
        Matrix(int rows, int cols) {
            numberOfRows = rows;
            numberOfCols = cols;
        }

        void createMatrix() {
            for (int i = 0; i < numberOfRows; ++i) {
                Row row(numberOfCols);
                row.createRow();
                matrix.push_back(row);
            }
        }

        void printMatrix() {
            for (int row = 0; row < numberOfRows; ++row) {
                std::cout << "[\t";
                for (int column = 0; column < numberOfCols; ++column) {
                    std::cout << matrix[row].getElement(column) << "\t";
                }
                std::cout << "]" << std::endl;
            }
        }

        void reduce() {
            for (int column = reducedColumns; column < numberOfCols; ++column) {
                bool topRow = true;
                int currentRow = reducedRows;
                for (int row = reducedRows; row < numberOfRows; ++row) {
                    if (topRow) {
                        if (matrix[row].getElement(column) != 0) {
                            matrix[row].reduce(matrix[row].getLeadingValue());
                            eliminate(row);
                            reducedRows++;
                            reducedColumns++;
                            break;
                        } else {
                            topRow = false;
                            currentRow = row;
                        }
                    } else {
                        if (matrix[row].getElement(column) != 0) {
                            Row temporaryRow = matrix[currentRow];
                            matrix[currentRow] = matrix[row];
                            matrix[row] = temporaryRow;
                            row = currentRow - 1;
                            topRow = true;
                        }
                    }
                }
            }
        }

        void eliminate(int reducedRow) {
            int index = matrix[reducedRow].getLeadingColumn();
            for (int row = 0; row < numberOfRows; ++row) {
                if (row == reducedRow) {
                    continue;
                } else {
                    double leadingValue = matrix[row].getElement(index);
                    for (int column = 0; column < numberOfCols; ++column) {
                        double reducedValue =
                            matrix[reducedRow].getElement(column) *
                            leadingValue;
                        double newValue =
                            matrix[row].getElement(column) - reducedValue;
                        matrix[row].setElement(column, newValue);
                    }
                }
            }
        }

       private:
        int numberOfRows;
        int numberOfCols;
        int reducedRows = 0;
        int reducedColumns = 0;
        std::vector<Row> matrix;
    };

    int rows = 0;
    int cols = 0;
    std::cin >> rows >> cols;
    Matrix test(rows, cols);
    test.createMatrix();
    test.printMatrix();
    std::cout << std::endl;
    test.reduce();
    test.printMatrix();
}
`}
      description={
        <>
          <p>
            This is C++ code I wrote to find the reduced row echelon form of a
            matrix. It definbitley isn't the most efficient way to do it, but it
            works and was a fun challenge for me to complete.
          </p>
          <p>
            The code has been slightly modified to work with WebAssembly. Setting up WebAssembly was a bit of a challenge in itself. The installation tutorial uses Linux by default, and I have used WSL before but I didn't want to for this.
          </p>
          <p>
            Once webassembly was installed integrating it into the site and pre-written C++ code was even harder.
          </p>
          <p>
            If anyone else were to attempt ths project, In would recommend just using TypeScript.
          </p>
        </>
      }
    />
  );
}
