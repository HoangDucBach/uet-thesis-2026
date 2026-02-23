
<a name="deepbook_balances"></a>

# Module `deepbook::balances`

<code><a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a></code> represents the three assets make up a pool: base, quote, and
deep. Whenever funds are moved, they are moved in the form of <code><a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a></code>.


-  [Struct `Balances`](#deepbook_balances_Balances)
-  [Function `empty`](#deepbook_balances_empty)
-  [Function `new`](#deepbook_balances_new)
-  [Function `reset`](#deepbook_balances_reset)
-  [Function `add_balances`](#deepbook_balances_add_balances)
-  [Function `add_base`](#deepbook_balances_add_base)
-  [Function `add_quote`](#deepbook_balances_add_quote)
-  [Function `add_deep`](#deepbook_balances_add_deep)
-  [Function `base`](#deepbook_balances_base)
-  [Function `quote`](#deepbook_balances_quote)
-  [Function `deep`](#deepbook_balances_deep)
-  [Function `mul`](#deepbook_balances_mul)
-  [Function `non_zero_value`](#deepbook_balances_non_zero_value)


<pre><code><b>use</b> <a href="../../dependencies/deepbook/math.md#deepbook_math">deepbook::math</a>;
<b>use</b> <a href="../../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../../dependencies/std/u128.md#std_u128">std::u128</a>;
<b>use</b> <a href="../../dependencies/std/vector.md#std_vector">std::vector</a>;
</code></pre>



<a name="deepbook_balances_Balances"></a>

## Struct `Balances`



<pre><code><b>public</b> <b>struct</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a> <b>has</b> <b>copy</b>, drop, store
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code><a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: u64</code>
</dt>
<dd>
</dd>
<dt>
<code><a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: u64</code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="deepbook_balances_empty"></a>

## Function `empty`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_empty">empty</a>(): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_empty">empty</a>(): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a> {
    <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a> { <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: 0, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: 0, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: 0 }
}
</code></pre>



</details>

<a name="deepbook_balances_new"></a>

## Function `new`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_new">new</a>(<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: u64, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: u64, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: u64): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_new">new</a>(<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: u64, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: u64, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: u64): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a> {
    <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a> { <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> }
}
</code></pre>



</details>

<a name="deepbook_balances_reset"></a>

## Function `reset`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_reset">reset</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_reset">reset</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>): <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a> {
    <b>let</b> old = *balances;
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> = 0;
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> = 0;
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> = 0;
    old
}
</code></pre>



</details>

<a name="deepbook_balances_add_balances"></a>

## Function `add_balances`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_balances">add_balances</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, other: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_balances">add_balances</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>, other: <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>) {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> = balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> + other.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>;
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> = balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> + other.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>;
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> = balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> + other.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>;
}
</code></pre>



</details>

<a name="deepbook_balances_add_base"></a>

## Function `add_base`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_base">add_base</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_base">add_base</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>: u64) {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> = balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> + <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>;
}
</code></pre>



</details>

<a name="deepbook_balances_add_quote"></a>

## Function `add_quote`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_quote">add_quote</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_quote">add_quote</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>: u64) {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> = balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> + <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>;
}
</code></pre>



</details>

<a name="deepbook_balances_add_deep"></a>

## Function `add_deep`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_deep">add_deep</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_add_deep">add_deep</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>, <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>: u64) {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> = balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> + <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>;
}
</code></pre>



</details>

<a name="deepbook_balances_base"></a>

## Function `base`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>): u64 {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>
}
</code></pre>



</details>

<a name="deepbook_balances_quote"></a>

## Function `quote`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>): u64 {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>
}
</code></pre>



</details>

<a name="deepbook_balances_deep"></a>

## Function `deep`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>): u64 {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>
}
</code></pre>



</details>

<a name="deepbook_balances_mul"></a>

## Function `mul`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_mul">mul</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>, factor: u64)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_mul">mul</a>(balances: &<b>mut</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>, factor: u64) {
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> = math::mul(balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>, factor);
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> = math::mul(balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>, factor);
    balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a> = math::mul(balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>, factor);
}
</code></pre>



</details>

<a name="deepbook_balances_non_zero_value"></a>

## Function `non_zero_value`



<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_non_zero_value">non_zero_value</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">deepbook::balances::Balances</a>): u64
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../../dependencies/deepbook/balances.md#deepbook_balances_non_zero_value">non_zero_value</a>(balances: &<a href="../../dependencies/deepbook/balances.md#deepbook_balances_Balances">Balances</a>): u64 {
    <b>if</b> (balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a> &gt; 0) {
        balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_base">base</a>
    } <b>else</b> <b>if</b> (balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a> &gt; 0) {
        balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_quote">quote</a>
    } <b>else</b> {
        balances.<a href="../../dependencies/deepbook/balances.md#deepbook_balances_deep">deep</a>
    }
}
</code></pre>



</details>
