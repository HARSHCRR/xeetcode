/* eslint-disable @typescript-eslint/no-explicit-any */
import { listToArray, type ListNode } from './structures.js';

export const LIST_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'reverse-a-list': (head: ListNode | null) => {
    let prev: ListNode | null = null;
    let node = head;
    while (node) {
      const next: ListNode | null = node.next;
      node.next = prev;
      prev = node;
      node = next;
    }
    return prev;
  },

  'list-has-a-cycle': (head: ListNode | null) => {
    let slow = head;
    let fast = head;
    while (fast?.next) {
      slow = slow!.next;
      fast = fast.next.next;
      if (slow === fast) return true;
    }
    return false;
  },

  'merge-two-sorted-lists': (a: ListNode | null, b: ListNode | null) => {
    const stub: ListNode = { val: 0, next: null };
    let tail = stub;
    let left = a;
    let right = b;
    while (left && right) {
      if (left.val <= right.val) {
        tail.next = left;
        left = left.next;
      } else {
        tail.next = right;
        right = right.next;
      }
      tail = tail.next;
    }
    tail.next = left ?? right;
    return stub.next;
  },

  'merge-many-sorted-lists': (lists: (ListNode | null)[]) => {
    const values: number[] = [];
    for (const list of lists) values.push(...listToArray(list));
    values.sort((a, b) => a - b);

    const stub: ListNode = { val: 0, next: null };
    let tail = stub;
    for (const value of values) {
      tail.next = { val: value, next: null };
      tail = tail.next;
    }
    return stub.next;
  },

  'drop-nth-from-end': (head: ListNode | null, n: number) => {
    const stub: ListNode = { val: 0, next: head };
    let lead: ListNode | null = stub;
    let trail: ListNode = stub;
    for (let i = 0; i <= n; i++) lead = lead?.next ?? null;
    while (lead) {
      lead = lead.next;
      trail = trail.next!;
    }
    trail.next = trail.next?.next ?? null;
    return stub.next;
  },

  'weave-list-ends': (head: ListNode | null) => {
    const values = listToArray(head);
    const stub: ListNode = { val: 0, next: null };
    let tail = stub;
    let lo = 0;
    let hi = values.length - 1;
    while (lo <= hi) {
      tail.next = { val: values[lo]!, next: null };
      tail = tail.next;
      lo++;
      if (lo <= hi) {
        tail.next = { val: values[hi]!, next: null };
        tail = tail.next;
        hi--;
      }
    }
    return stub.next;
  },
};
