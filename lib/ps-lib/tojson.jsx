/*jshint asi:true*/

ActionList.prototype.toJSON = function(){
  var object = [], index = this.count
  while (index-- > 0){
    object[index] = this.ao_getValue(index)
  }
  return object
}

ActionList.prototype.toSource = function ActionList$toSource(){
  var source = []
  var index = -1, length = this.count, typeID, config = []
  var key, type, valueType
  
  while (++index < length){
    type = ActionList.ao_getTypeString(this.getType(index))
    valueType = this.ao_getValueType(index)
    if (valueType === type) valueType = null
    
    config[index] = this.ao_getValue(index)
    
    // if (type == 'Object')
    // else
    if (valueType)
      source.push('if (' + index + ' in config)\tlist.put' + type + '('+valueType.toSource()+', config[' + index + '])')
      // source.push('if (' + index + ' in config)\tlist.put' + type + '('+valueType.toSource()+', stringIDToTypeID(config[' + index + ']))')
    else
      source.push('if (' + index + ' in config)\tlist.put' + type + '(config[' + index + '])')
  }
  source.unshift('var list = new ActionList')
  source.push('return list')
  return '(function(config){\n\t' + source.join(';\n\t') + '\n})(' + config.toSource() + ')'
}

ActionDescriptor.prototype.toSource = function ActionDescriptor$toSource(){
  var source = []
  var index = -1, length = this.count, typeID, config = new ao_Object
  var key, value, type, valueType, valueStringID
  var keyObj
  
  while (++index < length){
    typeID = this.getKey(index)
    keyObj = ActionDescriptor.parseTypeID(typeID)
    value = config[keyObj.configKey] = this.ao_getValue(typeID)
    
    type = ActionDescriptor.ao_getTypeString(this.getType(typeID))
    valueType = this.ao_getValueType(typeID)
    if (!(valueType instanceof ao_ActionType)) valueType = ActionDescriptor.ao_getTypeString(valueType)
    if (valueType === type) valueType = null
    
    try {
      valueStringID = ActionDescriptor.parseTypeID(value).stringID || null
    }
    catch(e){
      valueStringID = null
    }
    try {
      valueStringID = value.stringID
    }
    catch(e){
      valueStringID = null
    }
    if (valueStringID){
      value = config[keyObj.configKey] = valueStringID
    }
    
    if (valueType && valueType.toSource() === '({})') throw Error(valueType.toSource())
    // if (valueType && valueType.stringID);
    
    if (valueStringID && valueType)
      source.push('if ('+keyObj.js_in+')\tdescriptor.put' + type + '('+ keyObj.toSource() +', ' + valueType.toSource() + ', stringIDToTypeID(' + keyObj.js_get + '))')
    else if (valueType)
      source.push('if ('+keyObj.js_in+')\tdescriptor.put' + type + '('+ keyObj.toSource() +', ' + valueType.toSource() + ', ' + keyObj.js_get + ')')
    else
      source.push('if ('+keyObj.js_in+')\tdescriptor.put' + type + '('+ keyObj.toSource() +', ' + keyObj.js_get + ')')
  }
  source.unshift('var descriptor = new ActionDescriptor')
  source.push('return descriptor')
  return '(function(config){\n\t' + source.join(';\n\t') + '\n})' + config.toSource() + ''
}

function ao_ActionType(typeID){
  if (!(this instanceof ao_ActionType)) return new ao_ActionType(typeID)
  this.typeID = typeID
  this.stringID = typeIDToStringID(typeID)
  this.charID = typeIDToCharID(typeID)
}
ao_ActionType.prototype.toSource = function(){
  if (this.stringID === '') return 'charIDToTypeID(' + JSON.stringify(this.charID) + ')'
  return 'stringIDToTypeID(' + JSON.stringify(this.stringID) + ')'
}


ActionReference.prototype.toSource = function ActionReference$toSource(){
  var ref = this
  var source = []
  var index = -1, typeID, config = []
  var key, type, valueType, desiredClass
  while (ref){
    ++index
    try{desiredClass = ao_ActionType(ref.getDesiredClass())}catch(e){break;}
    type = ActionReference.ao_getTypeString(ref.getForm())
    try{valueType = ao_ActionType(ref.getEnumeratedType())}catch(e){}
    // if (valueType === type) valueType = null
    
    config[index] = ref.ao_getValue()
    
    if (type == 'Class'){
      source.push('if (' + index + ' in config)\tref.put' + type + '(config[' + index + '])')
      config[index] = desiredClass
    }
    else if (valueType)
      source.push('if (' + index + ' in config)\tref.put' + type + '(' + desiredClass.toSource() + ', ' + valueType.toSource() + ', config[' + index + '])')
    else
      source.push('if (' + index + ' in config)\tref.put' + type + '(' + desiredClass.toSource() + ', config[' + index + '])')
    
    try{ref = ref.getContainer()}
    catch(error){break;}
  }
  source.unshift('var ref = new ActionReference')
  source.push('return ref')
  return '(function(config){\n\t' + source.join(';\n\t') + '\n})(' + config.toSource() + ')'
}

ActionDescriptor.prototype.toJSON = function toJSON(){
  var object = {}
  var index = this.count, typeID, key
  // , typeIDO
  // var typeIDs = []
  while (index-- > 0){
    typeID = this.getKey(index)
    key = typeIDToStringID(typeID)
    // typeIDO = typeIDs[index] = {
    //   typeID:typeID,
    //   charID:typeIDToCharID(typeID),
    //   stringID:typeIDToStringID(typeID),
    //   type:ActionDescriptor.ao_getTypeString(this.getType(typeID)),
    //   valueType:ActionDescriptor.ao_getTypeString(this.ao_getValueType(typeID)),
    //   value:this.ao_getValue(typeID),
    // }
    
    if (toJSON.verbose)
      key = key
        + ':' + ActionDescriptor.ao_getTypeString(this.getType(typeID))
        + ':' + ActionDescriptor.ao_getTypeString(this.ao_getValueType(typeID))
    
    object[key] = this.ao_getValue(typeID)
  }
  return object
}
ActionDescriptor.keys = function(descriptor, keys){
  var index = descriptor.count
  if (keys == null) keys = Array(index)
  while (index-- > 0){
    keys[index] = typeIDToStringID(descriptor.getKey(index))
  }
  return keys
}

ActionList.prototype.ao_getValueType =
ActionDescriptor.prototype.ao_getValueType = function(key){
  var _DescValueType = this.getType(key)
  if (_DescValueType == DescValueType.ENUMERATEDTYPE) return ao_ActionType(this.getEnumerationType(key))
  if (_DescValueType == DescValueType.OBJECTTYPE) return ao_ActionType(this.getObjectType(key))
  if (_DescValueType == DescValueType.UNITDOUBLE) return ao_ActionType(this.getUnitDoubleType(key))
  return _DescValueType
}

ActionList.prototype.ao_getValue =
ActionDescriptor.prototype.ao_getValue = function(key){
  var _DescValueType = this.getType(key)
  if (_DescValueType == DescValueType.ALIASTYPE) return this.getPath(key)
  else if (_DescValueType == DescValueType.BOOLEANTYPE) return this.getBoolean(key)
  else if (_DescValueType == DescValueType.CLASSTYPE) return ao_ActionType(this.getClass(key))
  else if (_DescValueType == DescValueType.DOUBLETYPE) return this.getDouble(key)
  else if (_DescValueType == DescValueType.ENUMERATEDTYPE) return ao_ActionType(this.getEnumerationValue(key))
  else if (_DescValueType == DescValueType.INTEGERTYPE) return this.getInteger(key)
  else if (_DescValueType == DescValueType.LARGEINTEGERTYPE) return this.getLargeInteger(key)
  else if (_DescValueType == DescValueType.LISTTYPE) return this.getList(key)
  else if (_DescValueType == DescValueType.OBJECTTYPE) return this.getObjectValue(key)
  else if (_DescValueType == DescValueType.RAWTYPE) return this.getData(key)
  else if (_DescValueType == DescValueType.REFERENCETYPE) return this.getReference(key)
  else if (_DescValueType == DescValueType.STRINGTYPE) return this.getString(key)
  else if (_DescValueType == DescValueType.UNITDOUBLE) return this.getUnitDoubleValue(key)
  throw Error('unknown type');
}

ActionList.ao_getTypeString =
ActionDescriptor.ao_getTypeString = function(_DescValueType){
  if (_DescValueType == DescValueType.ALIASTYPE) return 'Path'
  else if (_DescValueType == DescValueType.BOOLEANTYPE) return 'Boolean'
  else if (_DescValueType == DescValueType.CLASSTYPE) return 'Class'
  else if (_DescValueType == DescValueType.DOUBLETYPE) return 'Double'
  else if (_DescValueType == DescValueType.ENUMERATEDTYPE) return 'Enumerated'
  else if (_DescValueType == DescValueType.INTEGERTYPE) return 'Integer'
  else if (_DescValueType == DescValueType.LARGEINTEGERTYPE) return 'LargeInteger'
  else if (_DescValueType == DescValueType.LISTTYPE) return 'List'
  else if (_DescValueType == DescValueType.OBJECTTYPE) return 'Object'
  else if (_DescValueType == DescValueType.RAWTYPE) return 'Raw'
  else if (_DescValueType == DescValueType.REFERENCETYPE) return 'Reference'
  else if (_DescValueType == DescValueType.STRINGTYPE) return 'String'
  else if (_DescValueType == DescValueType.UNITDOUBLE) return 'UnitDouble'
  throw Error('unknown type');
}

ActionDescriptor.typeIDFromKey = function(key, fallbackTypeID){
  var parsed = {key:key}
  if (key == null)
    return undefined
  if (key === '')
    parsed.typeID = fallbackTypeID
  else if (typeof key == 'number')
    parsed.typeID = key
  else if (key.charAt(0) == '^'){
    parsed.typeID = charIDToTypeID(key.substring(1))
  }
  else parsed.typeID = stringIDToTypeID(key)
  parsed.charID = typeIDToCharID(parsed.typeID)
  parsed.stringID = typeIDToStringID(parsed.typeID)
  return parsed
}

ActionDescriptor.parseTypeID = function(typeID){
  var parsed = {typeID:typeID}
  parsed.stringID = typeIDToStringID(typeID)
  parsed.charID = typeIDToCharID(typeID)
  parsed.configKey = parsed.stringID || '^' + parsed.charID
  parsed.configKey_isValidToken = false // /^[_$a-z][_$a-z0-9]*$/i.test(parsed.configKey)
  
  parsed.js_typeID = parsed.stringID
    ? 'stringIDToTypeID(' + JSON.stringify(parsed.stringID) + ')'
    : 'charIDToTypeID(' + JSON.stringify(parsed.charID) + ')'
  
  parsed.js_in = JSON.stringify(parsed.configKey) + ' in config'
  parsed.js_get = parsed.configKey_isValidToken
    ? 'config.' + parsed.configKey
    : 'config[' + JSON.stringify(parsed.configKey) + ']'
  parsed.js_set = parsed.js_get + ' = '
  
  
  // parsed.toJSON = function(){return {toString:this.toSource.bind(this)}}
  // parsed.toString = function(){return this.stringID}
  parsed.valueOf = function(){return this.js_typeID}
  parsed.toSource = function(){return this.js_typeID}
  return parsed
}

ActionDescriptor.parseKey = function(key, value){
  var parsed = {}
  var keyParts = key.split(':')
  
  parsed.key = ActionDescriptor.typeIDFromKey(keyParts[0])
  parsed.type = ActionDescriptor.typeIDFromKey(keyParts[2], parsed.key)
  
  if (keyParts[1]) parsed.methodName = 'put' + keyParts[1]
  if (!parsed.methodName && value != null){
    switch(value.reflect.name){
    case 'Number': parsed.methodName = 'putDouble'; break;
    case 'Array': parsed.methodName = 'putList'; break;
    case 'String': parsed.methodName = 'putString'; break;
    case 'Boolean': parsed.methodName = 'putBoolean'; break;
    case 'Object': parsed.methodName = 'putObject'; if (!parsed.type) parsed.type = parsed.key; break;
    
    case 'File': parsed.methodName = 'putPath'; break;
    case 'Folder': parsed.methodName = 'putPath'; break;
      
    case 'ActionReference': parsed.methodName = 'putReference'; break;
    
    // case 'Class': parsed.methodName = 'putClass'; break;
    // case 'Data': parsed.methodName = 'putData'; break;
    // case 'Integer': parsed.methodName = 'putInteger'; break;
    // case 'LargeInteger': parsed.methodName = 'putLargeInteger'; break;
    }
  }
  
  return parsed
}

ActionDescriptor.from = function(object){
  switch(object && typeof object == 'object' && object.reflect.name){
  case 'Object': break;
  default: return object
  }
  var descriptor = new ActionDescriptor
  Object.keys(object).forEach(function(key){
    var parsed = ActionDescriptor.parseKey(key, object[key])
    if (parsed.type)
      descriptor[parsed.methodName](parsed.key.typeID, parsed.type.typeID, ActionDescriptor.from(object[key]))
    else
      descriptor[parsed.methodName](parsed.key.typeID, ActionDescriptor.from(object[key]))
  })
  return descriptor
}

////////////////////////////////////////////////////////////////////////////////

ActionReference.prototype.toJSON = function(){
  var object = {}
  object.Class = typeIDToStringID(this.getDesiredClass())
  object[ActionReference.ao_getTypeString(this.getForm()).toLowerCase()] = this.ao_getValue()
  return object
}

ActionReference.prototype.ao_getValue = function(){
  var _ReferenceFormType = this.getForm()
  if (_ReferenceFormType == ReferenceFormType.CLASSTYPE) return ao_ActionType(this.getDesiredClass())
  if (_ReferenceFormType == ReferenceFormType.ENUMERATED) return ao_ActionType(this.getEnumeratedValue())
  if (_ReferenceFormType == ReferenceFormType.IDENTIFIER) return this.getIdentifier()
  if (_ReferenceFormType == ReferenceFormType.INDEX) return this.getIndex()
  if (_ReferenceFormType == ReferenceFormType.NAME) return this.getName()
  if (_ReferenceFormType == ReferenceFormType.OFFSET) return this.getOffset()
  if (_ReferenceFormType == ReferenceFormType.PROPERTY) return ao_ActionType(this.getProperty())
  throw Error('unknown type');
}

ActionReference.prototype.ao_putValue =
ActionReference.from = function(Class, value, type){
  var ref
  if (this instanceof ActionReference && !(this instanceof Function)) ref = this
  else ref = new ActionReference
  
  if (type == null){
    switch(typeof value){
    case 'undefined':
      for (var property in Class) {
        if (property == 'Class' || typeof Class[type] == 'function') continue;
        type = property
        value = Class[type]
        break;
      }
      Class = Class.Class
      break;
    case 'number': type = ReferenceFormType.IDENTIFIER; break;
    case 'string': type = ReferenceFormType.NAME; break;
    default:
      throw Error('expected type')
    }
  }
  Class = stringIDToTypeID(Class)
    
  if (type == 'identifier' || type == ReferenceFormType.IDENTIFIER) ref.putIdentifier(Class, value)
  else if (type == 'index' || type == ReferenceFormType.INDEX) ref.putIndex(Class, value)
  else if (type == 'name' || type == ReferenceFormType.NAME) ref.putName(Class, value)
  else if (type == 'offset' || type == ReferenceFormType.OFFSET) ref.putOffset(Class, value)
  else if (type == 'property' || type == ReferenceFormType.PROPERTY) ref.putProperty(Class, value)
  else if (value == null)
    ref.putDesiredClass(Class)
  else
    ref.putEnumeratedValue(Class, stringIDToTypeID(type), value)
  return ref
}

ActionReference.ao_getTypeString = function(_ReferenceFormType){
  if (_ReferenceFormType == ReferenceFormType.CLASSTYPE) return 'Class'
  if (_ReferenceFormType == ReferenceFormType.ENUMERATED) return 'Enumerated'
  if (_ReferenceFormType == ReferenceFormType.IDENTIFIER) return 'Identifier'
  if (_ReferenceFormType == ReferenceFormType.INDEX) return 'Index'
  if (_ReferenceFormType == ReferenceFormType.NAME) return 'Name'
  if (_ReferenceFormType == ReferenceFormType.OFFSET) return 'Offset'
  if (_ReferenceFormType == ReferenceFormType.PROPERTY) return 'Property'
  return
}

////////////////////////////////////////////////////////////////////////////////

UnitValue.prototype.toJSON = function(){
  return this.as('px')
}

////////////////////////////////////////////////////////////////////////////////

var toJSON_key_blacklist = {
  "parent":1,
  "this":1,
  "reflect":1,
  "arguments":1,
}
for (var key in Object.prototype) {
  toJSON_key_blacklist[Object.prototype[key]] = true
}

var toJSON_descriptor = {
  enumerable: false,
  value: function(){
    if (typeof this != 'object') return this;
    var object = {}
    this.reflect.properties.map(String).forEach(function(key){
      if (toJSON_key_blacklist[key]){
        // object[key] = Object.prototype.toString.call(this[key])
        return
      }
      object[key] = this[key]
    }, this)
    return object
  }
}

Object.defineProperty(Reflection.prototype, 'toJSON', toJSON_descriptor)
Object.defineProperty(ReflectionInfo.prototype, 'toJSON', toJSON_descriptor)
Object.defineProperty(Error.prototype, 'toJSON', toJSON_descriptor)

Object.defineProperty(File.prototype, 'toJSON', { enumerable:false, value: function(){ return this.fsName } })
Object.defineProperty(Folder.prototype, 'toJSON', { enumerable:false, value: function(){ return this.fsName } })

File.prototype.toSource = Folder.prototype.toSource = function() {
  return 'new ' + this.reflect.name + '(' + JSON.stringify(this.toJSON()) + ')'
}

var toString_toJSON_descriptor = {
  enumerable: false,
  value: function(){
    if (this.toString != Object.prototype.toString) return this.toString()
    return this
  }
}
// Object.defineProperty(Object.prototype, 'toJSON', toString_toJSON_descriptor)
Object.defineProperty(Array.prototype, 'toJSON', { enumerable:false, value: function(){ return this } })


////////////////////////////////////////////////////////////////////////////////

// Object.defineProperty(Object.prototype, 'ao_keys', { enumerable:false, value:function(){ return Object.keys(this) } })

function ao_Object(){
  if (!(this instanceof ao_Object)) return new ao_Object
}
ao_Object.prototype.toSource = function(){
  var source = []
  Object.keys(this).forEach(function(key){
    source.push(JSON.stringify(key) + ':\t' + uneval(this[key]))
  },this)
  return '({\n\t' + source.join(',\n\t') + '\n})'
}

function ao_Array(){
  if (!(this instanceof ao_Object)) return new ao_Array
}
ao_Array.prototype.toSource = function(){
  var source = []
  this.forEach(function(value, index){
    source.push(uneval(value))
  },this)
  return '[\n\t' + source.join(',\n\t') + '\n]'
}
