// !!!!! Alles ChatGPT !!!!!

export class Queue<T> {
    private items: T[] = [];
  
   
    enqueue(element: T): void {
      this.items.push(element);
    }

    dequeue(): T | undefined {
      return this.items.shift();
    }
  

    peek(): T | undefined {
      return this.items[0];
    }
  

    isEmpty(): boolean {
      return this.items.length === 0;
    }
  

    size(): number {
      return this.items.length;
    }

    clear(): void {
      this.items = [];
    }
  
    print(): void {
      console.log(this.items.toString());
    }
  }

  