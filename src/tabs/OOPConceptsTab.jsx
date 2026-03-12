// src/tabs/OOPConceptsTab.jsx — C++ / Python OOP Concepts Reference
import { useState } from "react";
import { useTheme } from "../utils/ThemeContext";

const CONCEPTS = [
  {
    key: "classes_objects", icon: "🏗️", title: "Classes & Objects", color: "#a855f7",
    oneliner: "A class is a blueprint. An object is a real instance built from it.",
    explanation: "A class defines structure and behavior. An object is a variable of that class — it occupies actual memory.",
    cpp: `class Car {
public:
    string brand;  // attribute
    int speed;
    void drive() {
        cout << brand << " driving at " << speed << " km/h" << endl;
    }
};
int main() {
    Car c1;           // object created
    c1.brand = "Toyota";
    c1.speed = 120;
    c1.drive();       // Toyota driving at 120 km/h
}`,
    python: `class Car:
    def __init__(self, brand, speed):
        self.brand = brand   # attribute
        self.speed = speed

    def drive(self):         # method
        print(f"{self.brand} driving at {self.speed} km/h")

# Object created
c1 = Car("Toyota", 120)
c1.drive()  # Toyota driving at 120 km/h`,
    exam_tip: "Every object gets its own copy of data members. Methods are shared.",
  },
  {
    key: "encapsulation", icon: "🔒", title: "Encapsulation", color: "#06b6d4",
    oneliner: "Bundle data + methods together and hide internal details.",
    explanation: "Private members can't be accessed directly from outside — only through public getter/setter methods.",
    cpp: `class BankAccount {
private:
    double balance;   // hidden
public:
    BankAccount(double b) : balance(b) {}
    void deposit(double amt) {
        if (amt > 0) balance += amt;
    }
    double getBalance() { return balance; }
};
int main() {
    BankAccount acc(1000);
    acc.deposit(500);
    // acc.balance = -9999; // ERROR! private
    cout << acc.getBalance(); // 1500
}`,
    python: `class BankAccount:
    def __init__(self, balance):
        self.__balance = balance   # private (name mangling)

    def deposit(self, amt):
        if amt > 0:
            self.__balance += amt

    def get_balance(self):
        return self.__balance

acc = BankAccount(1000)
acc.deposit(500)
# acc.__balance = -9999  # AttributeError!
print(acc.get_balance())  # 1500`,
    exam_tip: "C++: private/protected/public. Python: __name (name mangling) for private.",
  },
  {
    key: "inheritance", icon: "🧬", title: "Inheritance", color: "#10b981",
    oneliner: "A child class automatically gets all properties of the parent class.",
    explanation: "Inheritance enables code reuse. The derived class gets all public/protected members of the base class.",
    cpp: `class Animal {
public:
    string name;
    void eat() { cout << name << " is eating" << endl; }
};
class Dog : public Animal {
public:
    void bark() { cout << name << " says: Woof!" << endl; }
};
class GoldenRetriever : public Dog {
public:
    void fetch() { cout << name << " fetches!" << endl; }
};
int main() {
    GoldenRetriever g;
    g.name = "Buddy";
    g.eat();    // from Animal
    g.bark();   // from Dog
    g.fetch();  // own method
}`,
    python: `class Animal:
    def __init__(self, name):
        self.name = name
    def eat(self):
        print(f"{self.name} is eating")

class Dog(Animal):
    def bark(self):
        print(f"{self.name} says: Woof!")

class GoldenRetriever(Dog):
    def fetch(self):
        print(f"{self.name} fetches!")

g = GoldenRetriever("Buddy")
g.eat()    # from Animal
g.bark()   # from Dog
g.fetch()  # own method`,
    exam_tip: "C++: public/private/protected inheritance. Python: always public. Use super() to call parent.",
  },
  {
    key: "polymorphism", icon: "🔄", title: "Polymorphism", color: "#f59e0b",
    oneliner: "Same function name, different behavior depending on object type.",
    explanation: "Compile-time (overloading) and Runtime (virtual functions / method overriding). Runtime polymorphism is the key exam concept.",
    cpp: `// RUNTIME — Virtual Functions
class Shape {
public:
    virtual double area() = 0;  // pure virtual
};
class Circle : public Shape {
    double r;
public:
    Circle(double r) : r(r) {}
    double area() override { return 3.14159 * r * r; }
};
class Square : public Shape {
    double s;
public:
    Square(double s) : s(s) {}
    double area() override { return s * s; }
};
int main() {
    Shape* p = new Circle(5);
    cout << p->area();  // Circle::area() at runtime!
    p = new Square(4);
    cout << p->area();  // Square::area() at runtime!
}`,
    python: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    def area(self):
        return 3.14159 * self.r ** 2

class Square(Shape):
    def __init__(self, s):
        self.s = s
    def area(self):
        return self.s ** 2

shapes = [Circle(5), Square(4)]
for s in shapes:
    print(s.area())  # correct method called at runtime`,
    exam_tip: "C++: virtual keyword. Python: method overriding is automatic (duck typing).",
  },
  {
    key: "abstraction", icon: "🎭", title: "Abstraction", color: "#f87171",
    oneliner: "Show only what's necessary, hide the complex implementation.",
    explanation: "Abstract classes define an interface without implementation. You can't create objects of abstract classes directly.",
    cpp: `class DatabaseConnection {  // Abstract
public:
    virtual void connect() = 0;
    virtual void disconnect() = 0;
    virtual void query(string sql) = 0;
    void printStatus() {  // concrete method
        cout << "Connection active" << endl;
    }
};
class MySQLConnection : public DatabaseConnection {
public:
    void connect() override {
        cout << "MySQL: Connecting..." << endl;
    }
    void disconnect() override {
        cout << "MySQL: Closing." << endl;
    }
    void query(string sql) override {
        cout << "MySQL: " << sql << endl;
    }
};
// DatabaseConnection db; // ERROR!
// MySQLConnection db;    // OK`,
    python: `from abc import ABC, abstractmethod

class DatabaseConnection(ABC):  # Abstract
    @abstractmethod
    def connect(self): pass

    @abstractmethod
    def disconnect(self): pass

    @abstractmethod
    def query(self, sql): pass

    def print_status(self):  # concrete method
        print("Connection active")

class MySQLConnection(DatabaseConnection):
    def connect(self):
        print("MySQL: Connecting...")
    def disconnect(self):
        print("MySQL: Closing.")
    def query(self, sql):
        print(f"MySQL: {sql}")

# DatabaseConnection()  # TypeError!
db = MySQLConnection()  # OK`,
    exam_tip: "C++: pure virtual (=0). Python: @abstractmethod from abc module.",
  },
  {
    key: "constructors_destructors", icon: "⚙️", title: "Constructors & Destructors", color: "#8b5cf6",
    oneliner: "Constructor initializes an object. Destructor cleans it up.",
    explanation: "Constructors run automatically on creation. Destructors run when object goes out of scope or is deleted.",
    cpp: `class Student {
    string name;
    int* marks;
public:
    Student() : name("Unknown"), marks(new int[5]) {
        cout << "Default constructor" << endl;
    }
    Student(string n) : name(n), marks(new int[5]) {
        cout << "Created: " << name << endl;
    }
    Student(const Student& s) : name(s.name), marks(new int[5]) {
        for(int i=0;i<5;i++) marks[i] = s.marks[i];
        cout << "Copy constructor" << endl;
    }
    ~Student() {
        delete[] marks;
        cout << "Destructor: " << name << endl;
    }
};`,
    python: `class Student:
    def __init__(self, name="Unknown"):
        self.name = name
        self.marks = [0] * 5
        print(f"Created: {self.name}")

    def __del__(self):
        # Called when object is garbage collected
        print(f"Destructor: {self.name}")

    def __copy__(self):
        import copy
        new = Student(self.name)
        new.marks = self.marks.copy()
        return new

s1 = Student("Alice")
import copy
s2 = copy.copy(s1)  # copy constructor equivalent`,
    exam_tip: "C++: Rule of Three (destructor + copy ctor + copy assignment). Python: __init__ / __del__.",
  },
  {
    key: "virtual_functions", icon: "◆", title: "Virtual Functions & vTable", color: "#2dd4bf",
    oneliner: "virtual makes C++ decide which function to call at RUNTIME.",
    explanation: "Every class with virtual functions has a vTable. The vptr in each object points to its class's vTable for runtime dispatch.",
    cpp: `class Base {
public:
    virtual void show() {        // in vTable
        cout << "Base::show()" << endl;
    }
    void normalFunc() {          // NOT in vTable
        cout << "Base::normalFunc()" << endl;
    }
    virtual ~Base() {}           // ALWAYS virtual destructor!
};
class Derived : public Base {
public:
    void show() override {       // overrides vTable entry
        cout << "Derived::show()" << endl;
    }
};
int main() {
    Base* ptr = new Derived();
    ptr->show();       // "Derived::show()" — runtime dispatch
    ptr->normalFunc(); // "Base::normalFunc()" — compile-time
    delete ptr;
}`,
    python: `class Base:
    def show(self):
        print("Base.show()")

    def normal_func(self):
        print("Base.normal_func()")

class Derived(Base):
    def show(self):              # overrides automatically
        print("Derived.show()")

# Python is always "virtual" — all methods are dynamically dispatched
ptr = Derived()
ptr.show()        # Derived.show() — always runtime dispatch
ptr.normal_func() # Base.normal_func()

# Polymorphic usage
def call_show(obj: Base):
    obj.show()    # correct method always called

call_show(Derived())  # Derived.show()`,
    exam_tip: "Python methods are ALWAYS virtual. C++ needs the virtual keyword explicitly.",
  },
  {
    key: "operator_overloading", icon: "➕", title: "Operator Overloading", color: "#f59e0b",
    oneliner: "Redefine what operators like +, -, ==, << do for your custom class.",
    explanation: "Makes user-defined types behave like built-in types using the operator keyword (C++) or dunder methods (Python).",
    cpp: `class Complex {
    double real, imag;
public:
    Complex(double r=0, double i=0) : real(r), imag(i) {}
    Complex operator+(const Complex& c) {
        return Complex(real + c.real, imag + c.imag);
    }
    bool operator==(const Complex& c) {
        return real==c.real && imag==c.imag;
    }
    friend ostream& operator<<(ostream& os, const Complex& c) {
        os << c.real << " + " << c.imag << "i";
        return os;
    }
};
int main() {
    Complex c1(3,4), c2(1,2);
    Complex c3 = c1 + c2;   // operator+
    cout << c3;              // 4 + 6i
    cout << (c1 == c2);      // 0
}`,
    python: `class Complex:
    def __init__(self, real=0, imag=0):
        self.real = real
        self.imag = imag

    def __add__(self, other):       # overloads +
        return Complex(self.real + other.real,
                       self.imag + other.imag)

    def __eq__(self, other):        # overloads ==
        return self.real == other.real and self.imag == other.imag

    def __str__(self):              # overloads str() / print()
        return f"{self.real} + {self.imag}i"

    def __repr__(self):
        return f"Complex({self.real}, {self.imag})"

c1, c2 = Complex(3,4), Complex(1,2)
c3 = c1 + c2          # __add__
print(c3)              # 4 + 6i
print(c1 == c2)        # False`,
    exam_tip: "C++: operator keyword. Python: dunder methods __add__, __eq__, __str__, __len__, etc.",
  },
  {
    key: "templates", icon: "📐", title: "Templates / Generics", color: "#06b6d4",
    oneliner: "Write code once, use it for ANY data type.",
    explanation: "Templates (C++) / Generics (Python typing) let you write type-safe reusable code. Compiler generates separate versions per type.",
    cpp: `// Function Template
template <typename T>
T findMax(T a, T b) {
    return (a > b) ? a : b;
}

// Class Template
template <typename T>
class Stack {
    T data[100];
    int top = -1;
public:
    void push(T val) { data[++top] = val; }
    T pop() { return data[top--]; }
    bool isEmpty() { return top == -1; }
};

int main() {
    cout << findMax(3, 7);        // 7
    cout << findMax(3.14, 2.71);  // 3.14
    Stack<int> intStack;
    Stack<string> strStack;
    intStack.push(42);
    strStack.push("Hello");
}`,
    python: `from typing import TypeVar, Generic, List

T = TypeVar('T')

# Generic function
def find_max(a: T, b: T) -> T:
    return a if a > b else b

# Generic class
class Stack(Generic[T]):
    def __init__(self):
        self._data: List[T] = []

    def push(self, val: T) -> None:
        self._data.append(val)

    def pop(self) -> T:
        return self._data.pop()

    def is_empty(self) -> bool:
        return len(self._data) == 0

print(find_max(3, 7))         # 7
print(find_max(3.14, 2.71))   # 3.14
int_stack: Stack[int] = Stack()
int_stack.push(42)`,
    exam_tip: "C++: template<typename T>. Python: TypeVar + Generic from typing module.",
  },
  {
    key: "friend", icon: "🤝", title: "Friend Functions & Classes", color: "#ec4899",
    oneliner: "A friend can access private members — like a trusted outsider.",
    explanation: "Friend functions are not members of the class but have access to private/protected data. Python uses name mangling instead.",
    cpp: `class Box {
    double length, width, height;
public:
    Box(double l, double w, double h)
        : length(l), width(w), height(h) {}
    friend double getVolume(Box b);
    friend class BoxPrinter;
};

// Friend function — accesses private members!
double getVolume(Box b) {
    return b.length * b.width * b.height;
}

// Friend class
class BoxPrinter {
public:
    void print(Box b) {
        cout << "L=" << b.length
             << " W=" << b.width;
    }
};`,
    python: `# Python has no "friend" keyword
# Use name mangling or properties instead

class Box:
    def __init__(self, l, w, h):
        self.__length = l   # private
        self.__width  = w
        self.__height = h

    # Python approach: provide a method or property
    def get_volume(self):
        return self.__length * self.__width * self.__height

    # For "friend-like" access, expose via method
    def _get_dims(self):   # "protected" by convention
        return self.__length, self.__width, self.__height

class BoxPrinter:
    def print_box(self, box):
        l, w, h = box._get_dims()
        print(f"L={l} W={w}")

b = Box(3, 4, 5)
print(b.get_volume())   # 60`,
    exam_tip: "C++ only. Python equivalent: use properties, protected members (_name), or expose via methods.",
  },
  {
    key: "static", icon: "📌", title: "Static Members", color: "#a855f7",
    oneliner: "Static members belong to the CLASS, not any individual object.",
    explanation: "All objects share one copy of static data. Static methods can be called without creating an object.",
    cpp: `class Counter {
    static int count;   // shared across ALL objects
    int id;
public:
    Counter() {
        count++;
        id = count;
        cout << "Object " << id << " created. Total: " << count << endl;
    }
    ~Counter() {
        count--;
    }
    static int getCount() { return count; }
};

int Counter::count = 0;  // define outside — mandatory!

int main() {
    Counter c1, c2, c3;
    cout << Counter::getCount();  // 3
}`,
    python: `class Counter:
    count = 0   # class variable — shared across all objects

    def __init__(self):
        Counter.count += 1
        self.id = Counter.count
        print(f"Object {self.id} created. Total: {Counter.count}")

    def __del__(self):
        Counter.count -= 1

    @staticmethod
    def get_count():        # static method
        return Counter.count

    @classmethod
    def reset(cls):         # class method — alternative
        cls.count = 0

c1 = Counter()
c2 = Counter()
c3 = Counter()
print(Counter.get_count())  # 3`,
    exam_tip: "C++: static keyword + define outside. Python: class variable + @staticmethod or @classmethod.",
  },
  {
    key: "composition", icon: "🧩", title: "Composition & Aggregation", color: "#10b981",
    oneliner: "Build complex objects by combining simpler objects inside them.",
    explanation: "Composition (strong 'has-a'): inner object dies with outer. Aggregation (weak 'has-a'): inner can exist independently.",
    cpp: `class Engine {
public:
    int horsepower;
    Engine(int hp) : horsepower(hp) {}
    void start() {
        cout << "Engine started! HP: " << horsepower << endl;
    }
};
class Wheels {
public:
    int count;
    Wheels(int c) : count(c) {}
};

// COMPOSITION — Car owns its parts
class Car {
    Engine engine;
    Wheels wheels;
    string brand;
public:
    Car(string b, int hp, int wc)
        : brand(b), engine(hp), wheels(wc) {}
    void drive() {
        engine.start();
        cout << brand << " on " << wheels.count << " wheels" << endl;
    }
};`,
    python: `class Engine:
    def __init__(self, horsepower):
        self.horsepower = horsepower

    def start(self):
        print(f"Engine started! HP: {self.horsepower}")

class Wheels:
    def __init__(self, count):
        self.count = count

# COMPOSITION — Car owns its parts
class Car:
    def __init__(self, brand, hp, wheel_count):
        self.brand  = brand
        self.engine = Engine(hp)          # composition
        self.wheels = Wheels(wheel_count) # composition

    def drive(self):
        self.engine.start()   # delegation
        print(f"{self.brand} on {self.wheels.count} wheels")

car = Car("Toyota", 150, 4)
car.drive()`,
    exam_tip: "Prefer composition over inheritance for 'has-a'. Use inheritance for 'is-a'.",
  },
];

function ConceptCard({ concept, lang, C }) {
  const [open, setOpen] = useState(false);
  const code = lang === "python" ? concept.python : concept.cpp;
  const langLabel = lang === "python" ? "Python" : "C++";

  return (
    <div style={{ background:C.surface, border:"1px solid "+concept.color+"30", borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
        <div style={{ width:38, height:38, borderRadius:10, background:concept.color+"18", border:"1px solid "+concept.color+"35", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{concept.icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:C.text, marginBottom:2 }}>{concept.title}</div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.5 }}>{concept.oneliner}</div>
        </div>
        <div style={{ fontSize:18, color:C.muted, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform .2s" }}>⌄</div>
      </div>

      {open && (
        <div style={{ padding:"0 16px 16px", borderTop:"1px solid "+concept.color+"20" }}>
          <div style={{ background:concept.color+"0c", border:"1px solid "+concept.color+"25", borderRadius:10, padding:"10px 13px", margin:"12px 0 10px" }}>
            <div style={{ fontSize:12, color:C.text, lineHeight:1.8 }}>{concept.explanation}</div>
          </div>

          <div style={{ fontSize:9, color:C.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{langLabel} Example</div>
          <pre style={{ background:C.card, border:"1px solid "+C.border, borderLeft:"3px solid "+concept.color, borderRadius:10, padding:"12px 14px", fontSize:11, color:C.dim, fontFamily:"'JetBrains Mono',monospace", overflowX:"auto", lineHeight:1.7, margin:0 }}>
            {code}
          </pre>

          <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginTop:10, background:C.amber+"0c", border:"1px solid "+C.amber+"30", borderRadius:8, padding:"9px 12px" }}>
            <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
            <div style={{ fontSize:11, color:C.amber, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7 }}>
              <strong>Exam Tip: </strong>{concept.exam_tip}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OOPConceptsTab({ lang: propLang }) {
  const { C } = useTheme();
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("cpp");


  const filtered = CONCEPTS.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.oneliner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.accent}15,${C.cyan}08)`, border:"1px solid "+C.accentL+"25", borderRadius:14, padding:"16px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>
              🔷 OOP Concepts Reference
            </div>
            <div style={{ fontSize:11, color:C.muted, fontFamily:"'JetBrains Mono',monospace" }}>
              12 core OOP concepts · {lang === "python" ? "Python" : "C++"} examples · Click any card to expand
            </div>
          </div>

          {/* Lang toggle */}
          <div style={{ display:"flex", gap:2, background:C.card, borderRadius:9, padding:3, border:"1px solid "+C.border }}>
            {[{id:"cpp",label:"C++"},{id:"python",label:"Python"}].map(l => (
              <button key={l.id} onClick={()=>setLang(l.id)} style={{
                padding:"6px 14px", borderRadius:7, border:"none",
                background: lang===l.id ? (l.id==="python"?C.green+"22":C.accentL+"22") : "transparent",
                color: lang===l.id ? (l.id==="python"?C.green:C.accentL) : C.muted,
                fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                cursor:"pointer", fontWeight:lang===l.id?700:400, transition:"all .15s",
              }}>{l.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {["Classes","Encapsulation","Inheritance","Polymorphism","Abstraction","Constructors","Virtual","Operator Overloading","Templates","Friend","Static","Composition"].map((t,i) => (
            <span key={i} style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.accentL, background:C.accentL+"12", border:"1px solid "+C.accentL+"25", borderRadius:8, padding:"2px 8px" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e=>setSearch(e.target.value)}
        placeholder="🔍  Search concepts..."
        style={{ padding:"9px 13px", borderRadius:9, border:"1px solid "+C.border, background:C.card, color:C.text, fontFamily:"'JetBrains Mono',monospace", fontSize:12, outline:"none", width:"100%" }}
      />

      {/* Cards */}
      {filtered.map(c => <ConceptCard key={c.key+lang} concept={c} lang={lang} C={C} />)}

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
          No concepts found for "{search}"
        </div>
      )}
    </div>
  );
}