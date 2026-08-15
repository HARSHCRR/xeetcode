/**
 * C++ support code compiled into every submission.
 *
 * Mirrors the JavaScript prelude: node types for the pointer problems, plus
 * builders and serialisers so test data can stay plain values. Comparison is
 * structural and printing is only used to report a sample's actual value.
 */
export const CPP_PRELUDE = String.raw`
// Explicit includes rather than <bits/stdc++.h>: that header is a GCC
// extension and is absent on clang, which is what g++ resolves to on macOS.
// Listing them keeps local dev and the Linux deploy compiling the same source.
#include <algorithm>
#include <climits>
#include <cmath>
#include <cstdint>
#include <deque>
#include <functional>
#include <iostream>
#include <limits>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *n) : val(x), next(n) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}
};

namespace xc {

// Sentinel for a null hole in a level-order tree description.
const int NUL = INT_MIN;

ListNode* buildList(const vector<int>& values) {
    ListNode stub(0);
    ListNode* tail = &stub;
    for (int v : values) { tail->next = new ListNode(v); tail = tail->next; }
    return stub.next;
}

vector<ListNode*> buildLists(const vector<vector<int>>& arrays) {
    vector<ListNode*> out;
    for (const auto& a : arrays) out.push_back(buildList(a));
    return out;
}

vector<int> listToVector(ListNode* node) {
    vector<int> out;
    long guard = 0;
    // Bounded so a submission that builds a cycle cannot hang the judge.
    while (node && guard++ < 100000) { out.push_back(node->val); node = node->next; }
    return out;
}

TreeNode* buildTree(const vector<int>& values) {
    if (values.empty() || values[0] == NUL) return nullptr;
    TreeNode* root = new TreeNode(values[0]);
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (i < values.size() && !q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if (i < values.size()) {
            int v = values[i++];
            if (v != NUL) { node->left = new TreeNode(v); q.push(node->left); }
        }
        if (i < values.size()) {
            int v = values[i++];
            if (v != NUL) { node->right = new TreeNode(v); q.push(node->right); }
        }
    }
    return root;
}

vector<int> treeToVector(TreeNode* root) {
    vector<int> out;
    if (!root) return out;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if (!node) { out.push_back(NUL); continue; }
        out.push_back(node->val);
        q.push(node->left);
        q.push(node->right);
    }
    while (!out.empty() && out.back() == NUL) out.pop_back();
    return out;
}

// ---- structural comparison -------------------------------------------------

bool eq(int a, int b) { return a == b; }
bool eq(bool a, bool b) { return a == b; }
bool eq(double a, double b) { return fabs(a - b) < 1e-6; }
bool eq(const string& a, const string& b) { return a == b; }

template <typename T>
bool eq(const vector<T>& a, const vector<T>& b) {
    if (a.size() != b.size()) return false;
    for (size_t i = 0; i < a.size(); i++) if (!eq(a[i], b[i])) return false;
    return true;
}

/** Order-insensitive compare, for answers that are a set of groups. */
template <typename T>
bool eqUnordered(vector<T> a, vector<T> b) {
    if (a.size() != b.size()) return false;
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());
    return a == b;
}

// ---- printing (only ever used to show a visible sample's actual value) ------

string show(int v) { return v == NUL ? "null" : to_string(v); }
string show(bool v) { return v ? "true" : "false"; }
string show(double v) { ostringstream o; o << v; return o.str(); }
string show(const string& v) { return "\"" + v + "\""; }

template <typename T>
string show(const vector<T>& v) {
    string out = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) out += ","; out += show(v[i]); }
    return out + "]";
}

/** JSON-escapes a value for the single verdict line. */
string escape(const string& s) {
    string out;
    for (char c : s) {
        if (c == '"' || c == '\\') { out += '\\'; out += c; }
        else if (c == '\n') out += "\\n";
        else out += c;
    }
    return out;
}

} // namespace xc
`;
