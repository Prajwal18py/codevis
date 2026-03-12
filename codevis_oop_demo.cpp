/*
 * ============================================================
 *  CODEVIS — C++ OOP Demonstration
 *  Subject  : Object Oriented Programming
 *  Purpose  : Backend OOP logic powering the CODEVIS website.
 *             This file demonstrates all major OOP concepts
 *             used in the project.
 * ============================================================
 *
 *  OOP Concepts Demonstrated:
 *   1. Encapsulation          — private/protected members
 *   2. Abstraction            — pure virtual functions
 *   3. Inheritance            — Circle, Rectangle extend Shape
 *   4. Polymorphism           — virtual display() / area()
 *   5. Abstract Classes       — Shape (cannot be instantiated)
 *   6. Virtual Functions      — virtual area(), display()
 *   7. Method Overriding      — override keyword
 *   8. Constructor Init Lists — Shape(c), radius(r) syntax
 *   9. Composition            — Canvas owns Shape objects
 *  10. Templates/Generics     — Stack<T> generic container
 * ============================================================
 */

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <cmath> 

using namespace std;

// ─────────────────────────────────────────────────────────────
//  CONCEPT 2 & 5: Abstraction + Abstract Class
//  Shape is abstract — it cannot be instantiated directly.
//  area() is pure virtual (= 0), forcing subclasses to implement it.
// ─────────────────────────────────────────────────────────────
class Shape {
protected:                          // CONCEPT 1: Encapsulation
    string color;
    string name;

public:
    // CONCEPT 8: Constructor Initializer List
    Shape(const string& c, const string& n) : color(c), name(n) {}

    // CONCEPT 6: Virtual Functions
    virtual double area()      const = 0;   // pure virtual
    virtual double perimeter() const = 0;   // pure virtual

    virtual void display() const {          // virtual (overridable)
        cout << "[" << name << "] Color: " << color
             << " | Area: "      << area()
             << " | Perimeter: " << perimeter() << endl;
    }

    string getColor() const { return color; }   // getter
    string getName()  const { return name;  }

    virtual ~Shape() {}  // virtual destructor (important for polymorphism)
};


// ─────────────────────────────────────────────────────────────
//  CONCEPT 3: Inheritance — Circle extends Shape
//  CONCEPT 7: Method Overriding — area(), display() use override
// ─────────────────────────────────────────────────────────────
class Circle : public Shape {
private:                                    // CONCEPT 1: Encapsulation
    double radius;

public:
    // CONCEPT 8: Constructor Initializer List
    Circle(const string& color, double r)
        : Shape(color, "Circle"), radius(r) {}

    double area()      const override { return 3.14159 * radius * radius; }
    double perimeter() const override { return 2 * 3.14159 * radius;     }

    void display() const override {         // CONCEPT 4 & 7: Polymorphism + Override
        Shape::display();
        cout << "   Radius: " << radius << endl;
    }

    double getRadius() const { return radius; }
};


// ─────────────────────────────────────────────────────────────
//  CONCEPT 3: Inheritance — Rectangle extends Shape
// ─────────────────────────────────────────────────────────────
class Rectangle : public Shape {
private:
    double width, height;                   // CONCEPT 1: Encapsulation

public:
    Rectangle(const string& color, double w, double h)
        : Shape(color, "Rectangle"), width(w), height(h) {}

    double area()      const override { return width * height;       }
    double perimeter() const override { return 2 * (width + height); }

    void display() const override {
        Shape::display();
        cout << "   Width: " << width << " | Height: " << height << endl;
    }
};


// ─────────────────────────────────────────────────────────────
//  CONCEPT 3: Inheritance — Triangle extends Shape
// ─────────────────────────────────────────────────────────────
class Triangle : public Shape {
private:
    double a, b, c;                         // three sides

public:
    Triangle(const string& color, double a, double b, double c)
        : Shape(color, "Triangle"), a(a), b(b), c(c) {}

    double perimeter() const override { return a + b + c; }

    double area() const override {
        double s = perimeter() / 2.0;       // Heron's formula
        return sqrt(s * (s-a) * (s-b) * (s-c));
    }
};


// ─────────────────────────────────────────────────────────────
//  CONCEPT 9: Composition
//  Canvas HAS-A collection of Shapes.
//  Canvas owns the shapes (composition, not just association).
// ─────────────────────────────────────────────────────────────
class Canvas {
private:
    string title;
    vector<Shape*> shapes;                  // owns the shapes

public:
    Canvas(const string& t) : title(t) {}

    void addShape(Shape* s) { shapes.push_back(s); }

    void displayAll() const {
        cout << "\n=== Canvas: " << title << " ===\n";
        for (const auto& s : shapes) {
            s->display();                   // CONCEPT 4: Polymorphism — correct method called at runtime
        }
    }

    double totalArea() const {
        double total = 0;
        for (const auto& s : shapes) total += s->area();
        return total;
    }

    ~Canvas() {                             // Canvas cleans up its shapes
        for (auto s : shapes) delete s;
    }
};


// ─────────────────────────────────────────────────────────────
//  CONCEPT 10: Templates / Generics
//  A generic Stack that works with any type T.
// ─────────────────────────────────────────────────────────────
template <typename T>
class Stack {
private:
    vector<T> data;                         // CONCEPT 1: Encapsulation

public:
    void push(const T& val) { data.push_back(val); }

    T pop() {
        if (data.empty()) throw runtime_error("Stack underflow");
        T top = data.back();
        data.pop_back();
        return top;
    }

    T& peek() {
        if (data.empty()) throw runtime_error("Stack is empty");
        return data.back();
    }

    bool  isEmpty() const { return data.empty();    }
    int   size()    const { return (int)data.size(); }
};


// ─────────────────────────────────────────────────────────────
//  main() — Demonstrates all concepts together
// ─────────────────────────────────────────────────────────────
int main() {
    cout << "======================================\n";
    cout << "  CODEVIS — C++ OOP Demo\n";
    cout << "======================================\n\n";

    // CONCEPT 9: Composition — Canvas contains Shapes
    Canvas canvas("My Drawing");

    // CONCEPT 3 & 8: Inheritance + Constructor Init Lists
    canvas.addShape(new Circle("Red",    5.0));
    canvas.addShape(new Rectangle("Blue", 4.0, 6.0));
    canvas.addShape(new Triangle("Green", 3.0, 4.0, 5.0));

    // CONCEPT 4: Polymorphism — display() calls correct override at runtime
    canvas.displayAll();
    cout << "\nTotal canvas area: " << canvas.totalArea() << "\n";

    // CONCEPT 2: Abstraction — we work through Shape* without caring about type
    cout << "\n--- Polymorphic array demo ---\n";
    Shape* shapes[3];
    shapes[0] = new Circle("Purple",    3.0);
    shapes[1] = new Rectangle("Yellow", 5.0, 2.0);
    shapes[2] = new Triangle("Orange",  6.0, 8.0, 10.0);

    for (int i = 0; i < 3; i++) {
        shapes[i]->display();
        delete shapes[i];
    }

    // CONCEPT 10: Templates — Stack<int> and Stack<string>
    cout << "\n--- Generic Stack<int> ---\n";
    Stack<int> intStack;
    intStack.push(10);
    intStack.push(20);
    intStack.push(30);
    cout << "Peek: " << intStack.peek() << endl;
    cout << "Pop:  " << intStack.pop()  << endl;
    cout << "Pop:  " << intStack.pop()  << endl;

    cout << "\n--- Generic Stack<string> ---\n";
    Stack<string> strStack;
    strStack.push("Hello");
    strStack.push("OOP");
    strStack.push("World");
    cout << "Pop: " << strStack.pop() << endl;
    cout << "Pop: " << strStack.pop() << endl;

    cout << "\n======================================\n";
    cout << "  All OOP concepts demonstrated!\n";
    cout << "======================================\n";

    return 0;
}

/*
 * ============================================================
 *  HOW TO COMPILE & RUN:
 *    g++ -std=c++17 -o codevis codevis_oop_demo.cpp -lm
 *    ./codevis
 *
 *  OOP CONCEPT CHECKLIST:
 *   [✓] Encapsulation          — private/protected in all classes
 *   [✓] Abstraction            — Shape pure virtual area()
 *   [✓] Inheritance            — Circle, Rectangle, Triangle : Shape
 *   [✓] Polymorphism           — Shape* array, virtual dispatch
 *   [✓] Abstract Classes       — Shape with = 0 methods
 *   [✓] Virtual Functions      — virtual area(), display()
 *   [✓] Method Overriding      — override keyword used throughout
 *   [✓] Constructor Init Lists — Shape(c,n), radius(r) etc
 *   [✓] Composition            — Canvas owns Shape objects
 *   [✓] Templates/Generics     — Stack<T>
 * ============================================================
 */
