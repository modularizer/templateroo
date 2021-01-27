var templateroo = {
  modes: {
    varMode:'~x',
    activeVarMode: '@x',
    evalMode: '{{x}}',
    escapeMode: '{{{x}}}',
    forMode: '<key~x</key>',
    varObj: window,
  },
  htmlEscapes: {
    "'": "&quot",
    '"': "&quot",
    '<': "&lt",
    '>': "&gt",
    "~": "~<wbr>",
    "@": "@<wbr>",
    "{{{": "{<wbr>{<wbr>{",
    "{{": "{<wbr>{",
    "}}}": "}<wbr>}<wbr>}",
    "}}": "}<wbr>}",
  },
  escapeHTMLString: (s)=>{
    // console.log("escaping", s)
    for (let [key, val] of Object.entries(templateroo.htmlEscapes)){
      s = s.replaceAll(key, val)
    }
    // console.log(s)
    return s
  },
  unEscapeHTMLString: (s)=>{
    for (let [key, val] of Object.entries(templateroo.htmlEscapes)){
      s = s.replaceAll(val, key)
    }
    return s
  },
  escapeHTML: (s, mode = '{{{x}}}')=>{
    //make regexp
    let re = mode;
    re = templateroo.escape(re)
    re = re.replace('x','([^]*?)')
    re = new RegExp(re, 'g')

    //find matches
    let matches = templateroo.match(s, re)

    //eval and replace
    for (let match of matches){
      try{
        let v = templateroo.escapeHTMLString(match);
        s = s.replaceAll(mode.replace('x',match), v)
      }catch{}
    }
    return s
  },
  toString: (v)=>{
    if (typeof v === 'string' || v instanceof String){
      return v
    }else{
      return JSON.stringify(v)
    }
  },
  findUserVariables: (varObj = window)=>{
    let vars = {}
    let start = false;
    for (let variable in varObj) {
      if (variable !=='templateroo'){
        if (varObj.hasOwnProperty(variable)) {
          if (start){
            vars[variable] = varObj[variable]
          }
        }
      }else{
        start = true
      }
    }

    return vars
  },
  addVarChangeCbs: (varName, obj=window, changeCb=(vn,v)=>{}, setCb=(vn,v)=>{}, getCb=(vn,v)=>{}, prefix = '')=>{
    let val = window[varName]
    delete window[varName]
    // console.log(window[varName])
    Object.defineProperty(obj, varName,{
      set: (v)=>{
        if (v != this['_'+ varName]){
          changeCb(varName, v)
        }
        this['_'+ varName] = v;
        setCb(varName, v);
      },
      get: ()=>{
        let v = this['_' + varName];
        getCb(varName, v)
        return v
      },
    })
    window['_' + varName]= val
    if (obj[varName] instanceof Object){
      for (let k of Object.keys(obj[varName])){
        templateroo.addVarChangeCbs(k, obj[varName], changeCb, setCb, getCb, prefix + '.' + k)
      }
    }
  },
  monitorVars: (varNames, changeCb=(vn,v)=>{}, obj = window,)=>{
    for (let varName of varNames){
      templateroo.addVarChangeCbs(varName, obj, changeCb)
    }
  },
  monitorUserVars: (changeCb=(vn, v)=> {console.log(vn,"=",v)}, varNames = 'all')=>{
    if (varNames == 'all'){
      varNames = Object.keys(templateroo.findUserVariables());
    }
    templateroo.monitorVars(varNames, changeCb)
  },
  autoUpdateUserVars: (activeVarMode = '@x')=>{
    let changeCb = (varName, v)=>{
      console.log(varName,"=",v)
      templateroo.varUpdate(templateroo.doc, varName, v, activeVarMode)
    }
    console.log("adding autoUpdate to ", templateroo.activeVarNames)
    templateroo.monitorVars(templateroo.activeVarNames, changeCb)
  },
  escape: (s)=>{
    let escapes = '\\()[]{}./'
    for (let escape of escapes){
      s = s.replaceAll(escape, '\\'+ escape)
    }
    return s
  },
  match: (s, re)=>[...s.matchAll(re)].map((v)=>v.pop()).filter(v=>v),
  multi_index: (obj, mis)=>{
    if (obj.hasOwnProperty(mis)){
      return [obj[mis], true]
    }
    let indices = templateroo.match(mis, /(.*?)[[&quot]\.\]\[]+?/g);
    let v = obj
    if (indices.length > 0){
      try{
        for (let i of indices){
          v = v[i]
        }
        return [v, true]
      }catch{}
    }
    return [mis, false]
  },
  initialVarReplace: (s, varObj = window, mode = '~x', active = false)=>{
    //make regexp
    let re = RegExp(mode.replace('x','(.*?)') + `['"]?[$<>\\s]`,'g')

    //find variable names to replace
    let vars = templateroo.match(s + " ", re)
    // console.log(s, re, vars)

    //get variable object
    let vals = {}
    let found = []
    for (let v of vars){
      if (!found.includes(v)){
        //find value
        let [val, f] = templateroo.multi_index(varObj, v);

        if (f){
          //convert to string
          let s = templateroo.toString(val)

          //get index depth
          let n = v.replaceAll("[",".").split('.').length;

          vals[v] = {'val': val, 'str': s, 'n': n}

          //avoid repeat calculations
          found.push(v)
        }
      }
    }

    //sort by index depth then by length, so ~b[1] is replaced before ~b
    found.sort((k1, k2)=>{
      let n1 = vals[k1].n;
      let n2 = vals[k2].n;
      if (n1==n2){
        n1 = k1.length;
        n2 = k2.length;
      }
      return 1*(n1<n2)-1*(n1>n2)
    })

    //replace keys with values
    for (let v of found){
      if (active){
        let replacement = "<label class = "+ mode.replace('x',v)+" data-initial="+mode.replace('x',v)+">" + vals[v].str + '</label>'
        // console.log("active=",v)
        if (!templateroo.activeVarNames.includes(v)){
          templateroo.activeVarNames.push(v)
        }
        // console.log(templateroo.activeVarNames)
        s = s.replaceAll(mode.replace('x',v), replacement)
      }else{
        s = s.replaceAll(mode.replace('x',v), vals[v].str)
      }
    }
    return s
  },
  varUpdate: (s, varName, v, mode='@x')=>{
    let els = document.getElementsByClassName(mode.replace("x", varName))
    for (let el of els){
      let di = el.getAttribute("data-initial")
      di = di.replace(mode.replace('x',varName),v)
      di = templateroo.replaceConditionals(di)
      // di = templateroo.replace(di)
      el.innerHTML = di
    }
  },
  evalReplace: (s, mode = '{{x}}')=>{
    //make regexp
    let re = mode;
    re = templateroo.escape(re)
    re = re.replace('x','(.*)?')
    re = new RegExp(re, 'g')

    //find matches
    let matches = templateroo.match(s, re)

    //eval and replace
    for (let match of matches){
      try{
        let v = templateroo.toString(eval(match));
        s = s.replaceAll(mode.replace('x',match), v)
      }catch{}
    }

    return s
  },
  _findAll: (s0, f)=>{
    let s = s0
    let a = [];
    let c = -1;
    let i = s.indexOf(f);
    let n = f.length + ( -f.length + 1);
    while(i>-1){
      c+=(i+1);
      a.push(c);
      s = s.slice(i + n, s.length);
      i = s.indexOf(f);
    }
    return a
  },
  _matchNestedInds: (startInds, endInds)=>{
    let groups= [];
    let allInds = startInds.concat(endInds).sort((x,y)=>1*(x>y)-1*(y>x))
    // console.log(allInds)
    allInds.map((v)=>{
      let s = startInds.includes(v)
      if (s){
        groups.push([v]);
      }else{
        let n = groups.length -1;
        while(groups[n].length !=1){
          n--;
        }
        let level = groups.length -1 -n;
        groups[n].push(v);
      }
    })
    return groups
  },
  _matchGroups: (obj)=>{
    //remove empty values
    Object.keys(obj).map(k=>{if (obj[k].length == 0){delete obj[k]}})

    //reduce all values
    let reducedObj = Object.assign({},obj)
    Object.keys(reducedObj).map(k=> reducedObj[k]= reducedObj[k].reduce((a,v)=>a.concat(v),[]))

    //concat and sort all values
    let allInds = Object.values(reducedObj).reduce((a,v)=>a.concat(v),[]).sort((x,y)=>1*(x>y)-1*(y>x))

    //function to find which key contains a value
    let findKeyIncludes= (o,v) => Object.keys(o).find(k => o[k].includes(v))
    let findKeyEq= (o,v) => Object.keys(o).find(k => o[k] == v)
    let findKeyVal = v =>{
      let k = findKeyIncludes(reducedObj, v);
      let i = findKeyIncludes(obj[k], v);
      let start = findKeyEq(obj[k][i], v) == "0"
      return [k, obj[k][i], start]
    }

    let levelGroups = [];
    let level = -1;
    allInds.map((v)=>{
      let [k, group, start] = findKeyVal(v);

      if (start){
        level ++;
        if (level > (levelGroups.length -1)){
          levelGroups.push({});
        }
        if (!levelGroups[level][k]){
          levelGroups[level][k] = []
        }
        levelGroups[level][k].push(group)
      }else{
        level --;
      }
    })
    return levelGroups
  },
  _findNestedGroups: (s='', mode = '<key~x</key>', keys = ['for','while','if','switch'])=>{
    let re = ''
    let i = {}
    for(let key of keys){
      let [startKey, endKey] = mode.replaceAll('key',key).split('~x')
      let startInds = templateroo._findAll(s,startKey)
      let endInds = templateroo._findAll(s,endKey)
      let indGroups = templateroo._matchNestedInds(startInds, endInds)
      i[key]= indGroups
    }
    let groups = templateroo._matchGroups(i)
    return groups
  },
  _replaceString: (s, startInd=0, endInd=0, replacement="")=>{
    return s.slice(0,startInd) + replacement + s.slice(endInd)
  },
  _findAttributes: (inner, attrSeperator = '>', valSeperator = '=')=>{
    //make regExp
     let reString = '\\s*(.*?)\\s*' + valSeperator + '\\s*"*(.+?)"*[\\s$]'
    let re = new RegExp(reString,'g')

    //match attributes
    let temp = inner.split(attrSeperator)
    let t0 = temp[0] + " "
    let t1 = temp.slice(1).join(attrSeperator).trim()
    let matches = [...t0.matchAll(re)]

    //make obj
    let a = {}
    matches.map(v=>a[v[v.length-2]]= v.pop())
    let obj = [a, t1]
    return obj
  },
  _replaceFor: (a, val)=>{
    // console.log("For replacement: a=", a, "val=",val)
    let o = {
      var: '~_',
      range: false,
      list: [],
    }
    o = Object.assign(o, a);

    if (o.range){
      let i0;
      let i1;
      let step;
      if (!isNaN(o.range)){
        i1 = 1*o.range;
      }else if(Array.isArray(JSON.parse(o.range))){
        [i0, i1, step] = o.range
      }
      i0 |= 0
      i1 |= 1
      step |= 1
      for (let i= i0; i< i1; i+= step){
        o.list.push(i)
      }
    }
    if (typeof o.list === 'string' || o.list instanceof String){
      o.list = JSON.parse(o.list)
    }
    let out = [];
    for (let v of o.list){
      out.push(val.replaceAll(o.var, v))
    }
    let replacement = out.join("\n")
    return replacement
  },
  _replaceIf: (a, v)=>{
    let o = {
      condition: 'true',
    }
    o = Object.assign(o, a);
    v = ["",v][1*(o.condition=="true")]
    return v
  },
  _replaceSwitch: (a, v)=>{
    let o = {
      condition: '',
    }
    o = Object.assign(o, a);
    console.log(o.condition, v)
    let re = /<case[^]*?val\s*=["\s[&quot]]*([^]+?)["\s[&quot]]*?>[^]+?<\/case>/g
    let re2 = /<case[^]*?>([^]+?)<\/case>/g
    let cases = templateroo.match(v, re)
    let vals = templateroo.match(v, re2)
    console.log({cases,vals})
    if (cases.includes(o.condition)){
      let i = cases.indexOf(o.condition);
      v = vals[i]
    }
    // console.log(v, vals)
    return v
  },
  _replaceWhile: (a, v)=>{
    return v
  },
  replaceConditionals: (s, mode = '<key~x</key>', funcs = undefined)=>{
    let s0 = s
    if (!funcs){
      funcs = {
        for: templateroo._replaceFor,
        if: templateroo._replaceIf,
        switch: templateroo._replaceSwitch,
        while: templateroo._replaceWhile
      }
    }

    let startKeyLengthOffset = mode.split('~x')[0].length-3
    let endKeyLengthOffset = mode.split('~x')[1].length-3

    let replaceDeepestGroup = (s0, groups)=>{
      let group = groups[groups.length-1]
      let r = {}
      if (group){
        for (let k of Object.keys(group)){
          let func = funcs[k]
          for (let [startInd, endInd] of group[k]){
            let entire = s0.slice(startInd, endInd +  endKeyLengthOffset + k.length+1)
            let inner = s0.slice(startInd + startKeyLengthOffset + k.length, endInd)
            let [attr, val] = templateroo._findAttributes(inner)
            let replacement = func(attr, val);
            r[entire] = replacement;
          }
        }
        Object.keys(r).map((k)=>s = s.replace(k,r[k]))
      }
      return s
    }


    let groups = templateroo._findNestedGroups(s, mode, Object.keys(funcs));
    while(groups.length>1){
      s = replaceDeepestGroup(s, groups);
      groups = templateroo._findNestedGroups(s, mode, Object.keys(funcs));
    }
    s = replaceDeepestGroup(s, groups);
    return s
  },
  replace: (s, modes={})=>{
    let m = Object.assign(templateroo.modes, modes)
    s = templateroo.escapeHTML(s, m.escapeMode)
    s = templateroo.initialVarReplace(s, m.varObj, m.varMode);
    s = templateroo.initialVarReplace(s, m.varObj, m.activeVarMode, true)
    s = templateroo.replaceConditionals(s, m.conditionalMode)
    s = templateroo.evalReplace(s, m.evalMode);
    return s
  },
  replaceDoc: (s)=>{
    console.log('replacing doc')
    let v = templateroo.activeVarNames
    document.write(s)
    templateroo.activeVarNames = v
    templateroo.doc = s
  },
  createDocument: (window, modes = {})=>{
    document.addEventListener('DOMContentLoaded', function () {
      templateroo.activeVarNames= []
      let doc = document.documentElement.innerHTML
      let newDoc = templateroo.replace(doc, modes)
      templateroo.replaceDoc(newDoc);
      templateroo.autoUpdateUserVars();
    })
  },
}
