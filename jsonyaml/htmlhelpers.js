var isType = {
  element: (obj)=>obj instanceof HTMLElement,
  string: (s)=> typeof s === 'string' || s instanceof String,
  array: (a)=> Array.isArray(a),
  object: (obj) => obj instanceof Object
}


var template = {
  flatten: (obj, partials = false)=>{
    let o = {}
    for (let [key, val] of Object.entries(obj)){
      if (val instanceof Object){
        let flattened = template.flatten(val, partials)
        for (let [fk, fv] of Object.entries(flattened)){
          o[key + '.' + fk] = fv
        }
      }else{
        o[key] = val
      }
      if (partials){
        o[key] = val
      }
    }
    return o
  },
  _string: (s, varObj = {}, brackets = true)=>{
    varObj = template.flatten(varObj, true)
    for (let [varName, varVal] of Object.entries(varObj)){
      let vs = JSON.stringify(varVal)
      let varStr = vs.replaceAll('"',"'")
      if (vs instanceof String){
        varStr = vs.replaceAll('"',"'")
      }
      s = s.replaceAll(varName,varStr)
      if (brackets){
        let re = RegExp('"*' + varName.split('.').join('[.\\]]*'+ '[\\["' + "']*") +'["' + "']*" + "[.\\]]*" + '"*' ,'g')
        s = s.replaceAll(re, vs)
      }
    }
    s = s.replaceAll(`"'`,`"`)
    s = s.replaceAll(`'"`,`"`)
    return s
  },
  _obj: (obj, varObj = {})=>{
    return JSON.parse(template._string(JSON.stringify(obj), varObj))
  },
  makeVarObj: (varObj= {}, mode='~myVar') =>{
    let o = {}
    for (let [k, v] of Object.entries(varObj)){
      k = mode.replace('myVar',k)
      o[k] = v
    }
    return o
  },
  string: (s, varObj= {}, mode = '~myVar')=>{
    varObj = template.makeVarObj(varObj, mode)
    return template.strEval(template._string(s, varObj))
  },
  obj: (obj, varObj = {}, mode = '~myVar')=>{
    let s = template.string(JSON.stringify(obj), varObj, mode)
    return JSON.parse(s)
  },
  replace: (v, varObj = {}, mode = '~myVar')=>{
    let funcKey = ['obj','string'][1*isType.string(v)]
    return template[funcKey](v, varObj, mode)
  },
  strEval: (s, mode = '~eval(x)')=>{
    mode = mode.replaceAll('(','\\(')
    mode = mode.replaceAll(')','\\)')
    mode = mode.replace('x','(.*)?')
    let re = new RegExp(mode, 'g')
    let re2 = new RegExp(mode)
    try {
      let matches = [...s.match(re)]
      for (let match of matches){
        let inner = match.match(re2).pop()
        s = s.replace(match, eval(inner))
      }
    }catch{}

    return s
  },
  replaceForLoop: (type, val)=>{
    if (type.includes('for @')){
      type = type.replace('for @', 'for ~_ @')
    }

    let childType = type.split('for')[0].replaceAll(/\s*/g,'')
    if (childType){
      type = type.replace(childType,'')
      val = {[childType]: val}
    }

    let varName = [...type.matchAll(/for\s*(~\w*)\s*/g)][0].pop()
    let condition = type.split(/for\s*~\w*\s*@/g)[1]
    let arr = condition.match(/\[.*\]/)
    if (arr){
      arr = arr[0].replaceAll("'",'"')
      arr = JSON.parse(arr)
    }else{
      arr = condition.split(',').map(v=>1*v)
      let t = [];
      switch (arr.length) {
        case 1:
          for (let i=0; i<arr[0]; i++){t.push(i)}
          break
        case 2:
          for (let i=arr[0]; i<=arr[1]; i++){t.push(i)}
          break
        case 3:
          for (let i=arr[0]; i<=arr[2]; i+= arr[1]){t.push(i)}
          break
      }
      arr = t
    }

    let o = []
    for (let v of arr){
      let s = JSON.stringify(val).replaceAll(varName, v)
      o.push(JSON.parse(s))
    }
    return o
  }
}




var htmlHelpers = {
  addToEl: (el, ob = undefined, func = "setAttribute")=> {
    if (ob === undefined){
      return el
    }else{
      for (const [key, value] of Object.entries(ob)){
        if (key ==='styles'){
          el = htmlHelpers.addStyles(el,value);
        }else{
          if (['innerText','innerHTML'].includes(key)){
            el[key] = value
          }else{
            el[func](key, value);
          }
        }
      }
      return el;
    }
  },
  createStyleString: (styles)=>{
    let styleString = '';
    for (const [key, value] of Object.entries(styles)){
      let temp = key.toString() + ':' + value.toString() + ';'
      styleString += temp;
    }
    return styleString
  },
  addStyles: (el, styles)=>{
    if (styles == {}){return el
    }else{
      let a = el.getAttribute('style');
      let s = {}
      if (a){
        a = a.split(';')
        for (let i= 0; i< a.length; a++){
          let temp = a.split(':');
          s[temp[0]]= temp[1];
        }
      }else{
        a = {}
      }
      a = Object.assign(a, styles)
      let styleString = htmlHelpers.createStyleString(styles)
      el.setAttribute('style',styleString);
      return el;
    }
  },
  addStyleSheet: (styles, id = '') =>{
      let cssStyle = document.createElement('style');
      cssStyle.type = 'text/css'
      cssStyle.setAttribute('rel', 'stylesheet')
      if (styles.styleSheetId){
        cssStyle.setAttribute('id', styles.styleSheetId)
        delete styles.styleSheetId
      }
      for (let [s,d] of Object.entries(styles)){
        if (s != 'create'){
          let t = s + JSON.stringify(d)
          t = t.replaceAll(',',';')
          t = t.replaceAll('"','')
          let rules = document.createTextNode(t);
          cssStyle.appendChild(rules);
        }
      }
      document.head.appendChild(cssStyle);
  },
  createEl: (type, val, varObj = {}, mode = '~myVar')=>{
    let childType;
    let childVal;
    let childEl;
    type = template.replace(type, varObj, mode)
    val = template.replace(val, varObj, mode)
    varObj = {}

    if (type.substring(0,1)=='<'){
      type = type.substring(1)
    }
    if (type.match(/for\s*[@~]/)){
      let vals = template.replaceForLoop(type, val)
      let els = []
      for (let v of vals){
        let t = Object.keys(v)[0]
        els.push(htmlHelpers.createEl(t, v[t], varObj, mode))
      }
      return els
    }else{
      let el = document.createElement(type);

      if (type.includes('styles')){
          htmlHelpers.addStyleSheet(val)
      }else if (isType.string(val)){
        el.innerHTML = val
      }else if (isType.array(val)){
        htmlHelpers.addChildren(el, val, varObj, mode)
      }else{
        // add children
        let childrenKeys = Object.keys(val).filter(k=> k.includes('children'))
        for (let childrenKey of childrenKeys){
          let childrenVal = val[childrenKey]
          if (childrenKey.includes('children for')){
            delete val[childrenKey]
            let forKey = childrenKey.replace('children for','for')
            childrenKey = 'children'
            childrenVal = [{[forKey]: childrenVal}]
          }
          if (isType.array(childrenVal)){
            htmlHelpers.addChildren(el, childrenVal, varObj, mode)
          }
          delete val[childrenKey]
        }

        // add attributes
        console.log(val)
        el = htmlHelpers.addToEl(el, val);
      }
      return el
    }
  },
  addChild: (el, obj, varObj = {}, mode = '~myVar')=>{
    if (isType.element(obj)){
      el.appendChild(obj)
    }else if (isType.object(obj) && Object.keys(obj).length == 1){
      let type = Object.keys(obj)[0];
      let val = obj[type]
      let childEl;
      if (type.match(/for\s*[@~]/)){
        let vals = template.replaceForLoop(type,val)
        for (let v of vals){
          htmlHelpers.addChild(el, v, varObj, mode)
        }
      }else{
        htmlHelpers.addEl(el, type, val , varObj, mode)
      }
    }
    return el
  },
  addChildren: (el, objs, varObj = {}, mode = '~myVar')=>{
    for (let obj of objs){
      htmlHelpers.addChild(el, obj, varObj, mode)
    }
  },
  addEl: (parent, type, val, varObj = {}, mode = '~myVar')=>{
    let els = htmlHelpers.createEl(type, val, varObj, mode)
    if (!isType.array(els)){
      els = [els]
    }
    for (let el of els){
      parent.appendChild(el)
    }
  },
  createDocument: (d, varObj = {}, mode = '~myVar')=>{
    console.log(d)
    d = template.replace(d, varObj, mode)
    console.log(d)
    document.addEventListener('DOMContentLoaded', function () {
      for (let [type, val] of Object.entries(d)){
        if (type.substring(0,1)=='<'){
          type = type.substring(1)
        }

        if(isType.string(val)){
          document.innerHTML = val
        }else if (isType.element(val)){
          document.body.appendChild(val)
        }else if (isType.array(val)){
          for (let child of val){
            let childType = Object.keys(child)[0]
            let childVal = child[childType]
            htmlHelpers.addEl(document[type], childType, childVal, varObj, mode)
          }
        }else{
          if (val.attributes){
            htmlHelpers.addToEl(document[type], val.attributes)
          }
          if (val.children){
            htmlHelpers.addChildren(document[type], val.children)
          }
          if (val.headers){
           let headers = new Headers();
           return htmlHelpers.addToEl(headers, val.headers, "set");
         }
       }
     }
    })
  },
}


var examples = {
  js2html: ()=>{
    let w= 'testReplacement'
    let b = ["abc", "def","hij"]

    let a = {
        head: [
            {title: 'Lockaroo'},
            {styles: {
              '.hidden': {display: 'None'}
            }}
        ],
        body: [
          {div: 'a'},
          {b: 'b'},
          {div: {
            id: 'c',
            'children for ~m @~b': {input: {placeholder: '~m'}},
          }},
          {'img for @3': {src: './favicon.ico'}},
          {img: {src: './favicon.ico', class:'hidden'}},
          {'for @2': {div:'~w'}},
          {'div for @3': '~eval( 2+2 )'},
          {div: [{'b for ~x @["a","b","c","d"]': '~x'}]}
        ],
    }
    htmlHelpers.createDocument(a, {w, b})
  },
  yml2html : ()=>{
    let ymlFileString = `\
    ---\
    <head:\
    - <title: Lockaroo\
    - styles:\
        ".hidden": {display: None}\
    \
    <body:\
    - <div: a\
    - <b: b\
    - <div: {id: c , children for ~m @~b: {\
        <input: {placeholder: ~m}}}\
    - <img for @3: {src: "./favicon.ico"}\
    - <img: {src: "./favicon.ico", class: hidden}\
    - for @2:\
        <div: ~w\
    - <div for @3: ~eval( 2+2 )\
    - <div:\
      - <b for ~x @["a","b","c","d"]: "~x"\
    - <div: ~b[1]\
    - <div: ~c['a']\
    - <div: ~c.b['d']\
    - <button:\
        innerText: Hi\
        onclick: ~f\
    \
    `


  }
}

// module.exports = htmlHelpers
