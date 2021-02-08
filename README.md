# Welcome to Templateroo!

Templateroo is a **client-side html templating** package, written in pure javascript with no dependencies. The purpose of this package is to improve the html experience to make it quicker and easier to edit webpages or offline html files.

## How to Import
###  Html
To import the templateroo object into your html code, paste the following into anywhere in your html document **or** copy and paste the contents of the link into a `<script>`element.

    <script src='http://github.com/geargaroo/templateroo/templateroo.js></script>
This script element will by default run the templating code to change the html of the current **document**. If you wish to get the templateroo object without executing this code, include the attribute `init=false` in the`<script>` tag:



    <script init=false src='http://github.com/geargaroo/templateroo/templateroo.js></script>

# Features
## variable replacement
Templateroo offers both static and active variable replacement to make it easy to parameterize your document. This works by identifying variable names using a handle specified in `templateroo.settings` and replacing each instance with the value of the variable.

By default, variable replacement is implemented using the `window` object and therefore only **works on window-scoped variables. Therefore, do not use the `var` initializer** when creating variables in html inside of `<script>` elements .

Alternatively, if you wish to use another object containing the variables for replacement, edit `templateroo.settings.varObj=window`

**Example:**
```
<script>
	x = 0;
</script>
This var will not update: <b>~x<br>
But this var will update if x changes: <b>@x</b><br>
For instance if this button is pressed:
<button onchange="()=>{x++}">Increase x</button
```

## static variable replacement
Static variable replacement can be used for variables which do not need to be actively changed. For these variables, variable handles will be replaced with the value of the variable at the time the page is loaded and the element will not update if the variable changes.


To change default handler from **~** to your custom identifier, edit

    templateroo.settings.staticVarReplacement.varHandle = '~'
**Example:**
| html | rendered |
|--|--|
| `<script>a=5</script>`a=~a | a=5 |


## active variable replacement
Active variable replacement works by setting classes to identify which html elements are dependent upon each active variable, and will reload the dependent elements only (not the whole page) when the variable changes.


To change default handler from **@** to your custom identifier, edit

    templateroo.settings.activeVarReplacement.varHandle = '@'
 **Example:**
 | html | rendered |
|--|--|
| `<script>a=6</script>`a=@a | a=6 |


## eval
The inner contents of the `<eval>` tg  will be evaluated using the js `eval()` function.

**Example:**
 | html | rendered |
|--|--|
| `<script>x=2</script><eval>x+2<eval>` | 4 |


## escape
Inner contents of the `<esc>` tag will be escaped for both html and for templateroo keywords. Therefore, the following will be printed as strings and their contents will not be affected.  `~, @, <, >, ", '`. Additionally, other features such as variable replacement, eval, if, switch, for, etc. will not be executed on contents.

**Example:**
 | html | rendered |
|--|--|
| `<script>x=2</script><esc><eval>x+2<eval></esc>` | x+2 |


## for
The `<for>` tag expects the following attributes:

 - **var**: specify the string to be used for string replacement
 - **range**: can take one two or three inputs, mirrors range() in python
 - **list**: can be used *instead* of range, var will iterate through list using *of*

**Example:**
 | html | rendered |
|--|--|
| `<for range=3>a</for>` | aaa |
| `<for list=[a,b,c]>a</for>` | aaa |
| `<for var=y list=[a,b,c]>~y</for>` | abc |
| `<for var=x range=3>x</for>` | 012 |
| `<for var=x range=[1,3]>x</for>` | 123 |
| `<for var=x range=[1,5,2]>x</for>` | 135 |

## if
The `<if>` tag expects the folowing attributes:

 - **condition**: should evaluate to true and false. If true, innerHTML is rendered, if false, empty string is rendered.

**Example:**

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

**else and else if** tags are planned but not yet implemented. For now, switch/case should accomplish similar functionality.

## switch/case
The `<switch>` tag expects a **condition** attribute and children `<case>` elements with **val** attributes to compare condition to. Only the innerHTML of the matching `<case>` element is rendered.

**Example:**
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
## custom
Perhaps the most powerful of all of the features of templateroo, the `<custom>` tag is a good one to learn. The `<custom>` tags allows the user to create custom tags to reuse *similar* elements with custom parameters in multiple places on the page. These tags may be used in similar instances to `<for>` tags, but have the advantages of being able to take many variables and not having to be consecutive in the html. The custom tags are templated first (after escape), and there elements can include all other features inside of them. Nesting custom tags is untested, but development is planned.

The `<custom>` tag can be placed in any location of the html, and by default does not render itself, only instances of the custom tag which it defines. However, if the `show` attribute is included, the initial instance will render.

Note: **tagnames must be lowercase**.

**Example:**

Define a custom tag as follows below. The `tag` and `show` attribute names are reserved (show is optional),  as is the `~content` parameter. All other attributes set the parameters and default values of the element. `~content` will be replaced by the innerHTML of the instances of this custom element.

    <custom tag= 'first' var='a' text='hi' show>
      <hr>
      <button onclick="~var++">~text</button>
      <br>
      <b>~var=</b>@~var
      <br>
      <for range=@~var>a</for>
      <br>
      ~content
      <hr>
    </custom>

  Now, to create for instances of the `<first>` element defined above, simply use the tag and pass in as many of the parameters (`var` or `text` in this case) as desired.



    <first var='x' text = 'x++'>inner text</first>
    <first var='y' text = 'y++'>sadafsd</first>
    <first var='z' text = 'z++'>taco</first>

## faviconsvg
One of my pet peeves when debugging code locally in the brower, is the repeated error:
 `GET myfile.html/favicon.ico 404 (Not Found)  favicon.ico:1`

When you are using a server, it is pretty straightforward to set the favicon.ico image, but on a static html document this is not as straightforward. Using the stackedit response [here](https://stackoverflow.com/questions/5199902/isnt-it-silly-that-a-tiny-favicon-requires-yet-another-http-request-how-can-i#answer-62438464), I discovered that svg data can be pasted into the `href` attribute of a `<link rel='icon' type="image/svg+xml" />` element to set the favicon. Additionally, the data from user svg files made available to the server can be retrievered through `xhttp` requests and then converted to a data uri using `encodeURIComponent("<svg>...</svg>")` .

**Usage:**

 1. `src` attribute: link to an svg
 2. innerHTML: add svg inlinein innerHTML of `<faviconsvg>`
 3. defaults: `text`, `circle`,`color` attributes are builtin to allow user to easily set a colorful circle or letter, with default of a blue circle
 4. shortened svg: `default` attribute will nest innerHTML inside of `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'></svg>`
 5.
**Examples:**
 | html | rendered |
|--|--|
| `<faviconsvg src = 'myFile.svg'></faviconsvg>` | my image |
| `<faviconsvg></faviconsvg>` | blue circle |
| `<faviconsvg text = A></faviconsvg>` | blue A |
| `<faviconsvg text = A color=red></faviconsvg>` | red A |
| `<faviconsvg circle=red></faviconsvg>`| red circle |
| `<faviconsvg default><rect x="5" width="10" height="100" rx="15" /></faviconsvg>` | rectangle  |

## template
All of the features below are referred to as templating features. By default, the entire page will be templated, but if you m=wish to only template a section, edit

    templateroo.settings.template.tagName = 'html'
 to


    templateroo.settings.template.tagName = 'templateroo'
 and wrap anything you want templated with `<templateroo></templateroo>`


# Settings
The features listed above use Regular Expressions for string replacements. If for whatever reason the formulas cause issues for you, they can easily be modified at the top of the templateroo object in `templateroo.settings`
```
var templateroo = {
  settings: {//user parameters, allows you to change names of tags and attributes as well as source of variables
    staticVarReplacement: {
      varHandle: '~x',
    },
    activeVarReplacement: {
      varHandle: '@x',
      varClass: '.x',
      labelTagName: 'label',
    },
    for: {
      tagName: 'for',
      attrNames: {
        handle: 'var',
        range: 'range',
        array: 'list'
      },
      varHandle: '~x'
    },
    if: {
      tagName: 'if',
      attrNames: {
        condition: 'condition'
      }
    },
    switch: {
      tagName: 'switch',
      attrNames: {
        condition: 'condition'
      },
      case: {
        tagName: 'case',
        attrNames: {
          value: 'val'
        }
      }
    },
    eval: {
      tagName: 'eval'
    },
    escape: {
      tagName: 'esc',
    },
    custom: {
      tagName: 'custom',
      attrNames: {
        tagName: 'tag',
        showTemplate: 'show'
      },
      attrHandle: '~x',
      innerHandle: 'content',
      alwaysShowTemplate: false,
    },
    faviconsvg: {
      tagName: 'faviconsvg'
    },
    template: {
      tagName: 'html'
    },
    varObj: window, //object which contains all of the variables which you wish to use for variable replacement
  },
```


## Planned Additions
### **`<scrape>`**:
load and scrape a webpage, update at some specified interval

### **`<demo>`**
for translating code blocks to-from templating and rendering html

### **`<elseif>`**,  **`<else>`**:
planned for use with `<if>` tag



## Tests and Demos
A few barebones examples are available in [examples](http://github.com/geargaroo/templateroo/examples). I will work to develop this further and make more demos.

## Suggestions/Questions
If you have questions about use or suggestions for future development, please let me know
[`geargarooco@gmail.com`](https://mail.google.com/mail/u/0/?fs=1&view=cm&shva=1&to=geargarooco@gmail.com&su=Templateroo:%20Questions/Suggestions&tf=1&body=Hi%20Torin,)
