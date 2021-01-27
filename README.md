# Welcome to Templateroo!

Templateroo is a **client-side html templating** package, written in pure javascript with no dependencies. The purpose of this package is to improve the html experience to make it quicker and easier to edit webpages or offline html files.

## How to Import
###  Html
To import the templateroo object into your html code, paste the following into anywhere in your html document **or** copy and paste the contents of the link into a `<script>`element.

    <script src='http://github.com/geargaroo/templateroo/clientSide/templateroo.js></script>
After importing, run the templating function as follows:



    <script>templateroo.createDocument()</script>



### Node.js
The contents of http:/github/pseudoServerSide is available on Node.js. Please note the folder name **pseudo**ServerSide. Because Node.js is a server-side application, this implementation works by appending the contents of the templateroo object appended as a string at the end of the html. The code will still run on client-side and thus security issues could arise.

    npm i templateroo
 After install, import as follows:
 ```
 const templater== = require('templateroo')
 ```

 Use as follows:
 ```
//to render files with a node server...
//copy the following into app.js
//in command line run npm app.js
//in Chrome, open http:/localhost:3000/myFileName.html

const http = require('http')
const fs = require('fs')
const templateroo = require('templateroo')

const server = http.createServer(function (request, response) {
  let filePath = '.' + request.url
  fs.readFile(filePath, function(error, content) {
    if (!error){
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(templateroo.template(content), 'utf-8');
    }
  });
})
server.listen(port, hostname, () => {})
```

## Implementations
There are currently **three implementations** of this code: clientSide, pseudoServerSide, clientSide/jsonyaml. All updates will be made first to clientSide. Json and yaml templating work well but likely will not be updated soon if at all. psuedoServerSide is a bit hacky. Hopefully I will find a better way to make this available on **Node.js**.

## Features

### variable replacement
Templateroo includes both static and active variable replacement, although the active variable replacement is still partially a work in progress and needs some development in nested cases.

 - **~myStaticVar**: this variable will be replaced when the page is rendered and not updated again
 - **@myActiveVar**: this variable will be replaced when the page is rendered and updated if the value changes

**Note: variable replacement is implemented using the window object and therefore only works on window-scoped variables. If creating variables in html inside `<script>` element, do not use **var** initializer
```
<script>
	x = 0;
</script>
This var will not update: <b>~x<br>
But this var will update if x changes: <b>@x</b><br>
For instance if this button is pressed:
<button onchange="()=>{x++}">Increase x</button
```

### eval
The inner contents between`{{` and `}}` will be evaluated using the js `eval()` function.
```
<script>
	x=2
</script>
{{x+2}} <!-- renders as 4 -->
```

### escape
Contents between `{{{` and `}}}` will be escaped for both html and for templateroo keywords. Therefore, the following will be printed as strings and their contents will not be affected.
```
~, @, {{}}, <, >, ", ', {{{}}}
```


### for
The `<for>` tag expects the following attributes:

 - **var**: specify the string to be used for string replacement
 - **range**: can take one two or three inputs, mirrors range() in python
 - **list**: can be used *instead* of range, var will iterate through list using *of*


    ```
    <for range=3>a</for>  =>  aaa
    <for list=[a,b,c]>a</for>  => aaa
    <for var=~x range=3>~x</for>  => 012
    <for var=~x range=[1,2]>~x</for>  =>  123
    <for var=~x range=[1,5,2]>~x</for>  =>  135
    <for var=~x list=[a,b,c]>~x</for>  => abc
    ```

### if
The `<if>` tag expects the folowing attributes:

 - **condition**: should evaluate to true and false. If true, innerHTML is rendered, if false, empty string is rendered. Not yet working with active variables, but will be implemented soon.
 ```
 <script>
	 x=true
	 y=false
</script>
<if condition=~x>
	This will be displayed
</if>
<if condition=~y>
	This will not.
</if>
```

**else and else if** tags are planned but not yet implemented

### switch/case
The `<switch>` tag expects a **condition** attribute and children `<case>` elements with **val** attributes to compare condition to. Only the innerHTML of the matching `<case>` element is rendered.
```
<script>
	x = 'b'
</script>
<switch condition=~x>
	<case val=a>This won't be printed</case>
	<case val=b>This will be</case>
	<case val=c>But this won't</case>
</switch>
```
## Custom RegExps
The features listed above use Regular Expressions for string replacements. If for whatever reason the formulas cause issues for you, they can easily be modified at the top of the templateroo object (templateroo.modes) **or** modified using inputs to the templateroo.createDocument()  or templateroo.replace() function
```
var templateroo = {
  modes: {
    varMode:'~x',
    activeVarMode: '@x',
    evalMode: '{{x}}',
    escapeMode: '{{{x}}}',
    forMode: '<key~x</key>',
    varObj: window,
  },
```
...
```
replace: (s, modes={})=>{
    let m = Object.assign(templateroo.modes, modes)
    s = templateroo.escapeHTML(s, m.escapeMode)
    s = templateroo.initialVarReplace(s, m.varObj, m.varMode);
    s = templateroo.initialVarReplace(s, m.varObj, m.activeVarMode, true)
    s = templateroo.replaceConditionals(s, m.conditionalMode)
    s = templateroo.evalReplace(s, m.evalMode);
    return s
  },
```

## In Progress
**active variable replacement**: Currently only works in simple versions of inner HTML. If used for tags or attributes or inside of custom elements like `<for>` or `<if>`

## Planned Additions
### **`<demo>`**
for translating code blocks to-from templating and rendering html

### **`<templateroo>`**:
plan to allowthe templating function to be implemented for select elements only

### **`<elseif>`**,  **`<else>`**:
planned for use with `<if>` tag

### **`<while>`**:
 may implement in cases of iteration, for use with active variables, or for use with timeouts and intervals

### **`<varblock>`**:
 plan to allow html block to be named and re-used

### **`<yaml`>**
Yaml templating is a work in progress  which allows templating with yml instead of html. See clientSide/yaml

### **`<json>`**
JSON tempating is a work in progress  which allows templating with JSON/js objects instead of html. See clientSide/json

## Tests and Demos
A barebones example is available in [clientSide/example.html](http://github.com/geargaroo/templateroo/clientSide/example.html). I will work to develop this further and make more demos.

## Suggestions/Questions
If you have questions about use or suggestions for future development, please let me know
[`geargarooco@gmail.com`](https://mail.google.com/mail/u/0/?fs=1&view=cm&shva=1&to=geargarooco@gmail.com&su=Templateroo:%20Questions/Suggestions&tf=1&body=Hi%20Torin,)
