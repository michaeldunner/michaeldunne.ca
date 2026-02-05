"use client";
import { Code } from "./code";

export function RREF() {
  return (
    <Code
      title="RREF Solver"
      subtitle="Put any matrix into reduced row echelon form."
      date="01/29/2026"
      code={`#include <iostream>
#include <vector>

int main() {
    class Row {
       public:
        Row(int columns) {
            numberOfColumns = columns;
        }

        void createRow() {
            for (int column = 0; column < numberOfColumns; ++column) {
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
            for (int column = 0; column < numberOfColumns; ++column) {
                if (elements[column] != 0) {
                    return column;
                }
            }
            return numberOfColumns;
        }

        double getLeadingValue() {
            int leadingColumn = getLeadingColumn();
            return elements[leadingColumn];
        }

        void reduce(double reducer) {
            for (int i = 0; i < numberOfColumns; ++i) {
                elements[i] = elements[i] / reducer;
            }
            return;
        }

       private:
        int numberOfColumns;
        std::vector<double> elements;
    };

    class Matrix {
       public:
        Matrix(int rows, int columns) {
            numberOfRows = rows;
            numberOfColumns = columns;
        }

        void createMatrix() {
            for (int i = 0; i < numberOfRows; ++i) {
                Row row(numberOfColumns);
                row.createRow();
                matrix.push_back(row);
            }
        }

        void printMatrix() {
            for (int row = 0; row < numberOfRows; ++row) {
                std::cout << "[\t";
                for (int column = 0; column < numberOfColumns; ++column) {
                    std::cout << matrix[row].getElement(column) << "\t";
                }
                std::cout << "]" << std::endl;
            }
        }

        void reduce() {
            for (int column = reducedColumns; column < numberOfColumn s; ++column) {
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
    int columns = 0;
    std::cin >> rows >> columns;
    Matrix test(rows, columns);
    test.createMatrix();
    test.printMatrix();
    std::cout << std::endl;
    test.reduce();
    test.printMatrix();
}
`}
      description={
        <div className="flex flex-col gap-4">
          <p>
            This is C++ code I wrote to find the reduced row echelon form of a
            matrix. It definitely isn't the most efficient way to do it, but it
            works and was a fun challenge for me to complete.
          </p>
          <p>
            The code has been slightly modified to work with WebAssembly. Setting up WebAssembly was a bit of a challenge in itself. The installation tutorial uses Linux by default, and I have used WSL before but I didn't want to for this.
          </p>
          <p>
            Once webassembly was installed integrating it into the site and pre-written C++ code was even harder.
          </p>
          <p>
            If anyone else were to attempt ths project, In would recommend just writing the solver in TypeScript.
          </p>
          <p>
            Check out the original source code below. It has since been modified to work with WebAssembly, and new features have been implemented, such as BEDMAS and complex numbers.
          </p>
        </div>
      }
    />
  );
}
