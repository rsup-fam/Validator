;(function(global, utils) {



  var Validator = function(form, options) {
    this.init(form, options);
  };
  
  
  Validator.prototype = {
    constructor: Validator,
    init: function(form, newOptions) {
      utils.init(form, newOptions);
    },
    setErrorMsg: function (target, msg){},
    setValidCondition: function (target, valid, regex){},
    setSubmitBtn: function(submitBtn) {}
  };



  var validator = new Validator('#form', {
    valids: {
      email: /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
      password: /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,16}$/
    },
    isRealTimeCheck: true
  });



  window.Validator = Validator;

})(window, (function () {

  var options = {
    valids: {
      /*
        valid,
        msg
      */
      email: /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
      password: /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,16}$/,
      xss: /[\/:?*<>"|&\\%+;']/g
    },
    msg: {
      xss: '/:?*<>"|&\\%+;를 사용할 수 없습니다.',
      style: {}
    },
    isRealTimeCheck: false
  };
  var formEl;
  var submitBtnEl;
  var checkTagInfos = [];

  var messages = {
    
  }

  var hasElement = function(target) {

    if(getType(target) !== 'string') {
      console.log('string 형식의 인자만 받을 수 있습니다.');
      return false;
    }

    return document.querySelector(target) ? true : false;
  }

  var isElementNode = function(target) {
    console.log(target);
    if(getType(target).indexOf('element') === -1) {
      return false;
    }

    return target.nodeType === 1 ? true : false;
  }
  
  /**
   *
   * 외부에 노출할 함수
   *
   */
  
  var getType = function(target) {
    return Object.prototype.toString.call(target).toLowerCase().slice(8, -1);
  };

  var getFormEl = function(target) {
    
    if(!target) {
      throw 'form 입력값을 추가해주세요.';
    }

    var formRegex = /^.|^#/g; // form 태그일 때도 추가해야 함.
    var targetType = getType(target);
    var isElement = isElementNode(target);

    switch(targetType) {
      case 'string':
        if(!formRegex.test(target)) {
          throw '유효하지 않은 셀렉터입니다.';
        }

        formEl = document.querySelector(target);

        if(!formEl) {
          throw 'element를 찾을 수 없습니다.';
        }
      break;
      case 'object':
        if(!isElement) {
          throw 'selector 또는 elementNode만 target으로 들어올 수 있습니다.';
        }
        formEl = target;
      break;
      default:
        throw 'selector, element 객체가 필요합니다.';
    }
  }

  var setSubmitBtnEl = function() {

    var submitBtnSelector = 'button[type="submit"]';

    submitBtnEl = hasElement(submitBtnSelector) ? document.querySelector(submitBtnSelector) : undefined;
  }

  var checkXSS = function(target) {
    
    if(!isElementNode(target)) {
      console.error(target + '이 elementNode가 아닙니다.');
      return;
    } 

    return options.valids.xss.test(target.value) ? true : false;
  }

  var setCheckTagInfos = function() {
    var validTags = formEl.querySelectorAll('[data-valid]');

    validTags.forEach(function(tag) {
      var valids = tag.getAttribute('data-valid');
      var inputInfo = {
        el: tag,
        type: tag.type,
        nodeName: tag.nodeName,
        valids: valids.split(' '),
      };
      
      checkTagInfos.push(inputInfo);
    });
  }

  var extendOpts = function(oldOpts, newOpts) {

    if(!newOpts) {
      return;
    }

    for(var prop in newOpts) {
      if(newOpts.hasOwnProperty(prop)) {
        if(getType(newOpts[prop]) === 'object') {

          extendOpts(oldOpts[prop], newOpts[prop]);
        } else if(getType(newOpts[prop]) === 'array') {
          
          oldOpts[prop] = newOpts[prop].slice();
        } else {
          
          oldOpts[prop] = newOpts[prop];
        }
        
      }
    }
  };

  var bindEvent = function() {
    
    checkTagInfos.forEach(function(tagInfo) {
      var el = tagInfo.el;
      var nodeName = tagInfo.nodeName.toLowerCase();

      switch(nodeName) {
        case 'input':
          el.addEventListener('keyup', keyupEvent);  
        break;
        case 'select':
          el.addEventListener('change', changeEvent);
        break;
      }
    });
  };

  var changeEvent = function(e) {
    if(options.isRealTimeCheck) {
      console.log(checkValid(e.target, false));
    }
  }
  var keyupEvent = function(e) {
  
    if(checkXSS(e.target)) {
      alert(options.msg.xss);
      e.target.value = e.target.value.replace(options.valids.xss, ''); 
      return;    
    };

    if(options.isRealTimeCheck) {
      console.log(checkValid(e.target, true));
    }
  }

  var checkValid = function(target, isPreventRequired) {

    /*
      ** 매개변수로 뭘받지?
        - valids
        - isPreventRequired
      고려할 점
      1. realTime에도 적용해야하기 때문에 required 부분을 좀 고려해야함
    */

    // 1. required 고려하기

    var _options = options;
    var valids = target.getAttribute('data-valid');
    var validObj = {
      validType: '',
      validMsg: '',
      isValid: true
    };
    var value = target.value;
    console.log(value);

    if(!valids) {
      return;
    }
    
    valids = valids.split(' ');
    
    console.log('valids: ', valids);

    valids.forEach(function(valid) {
      var validReg = _options.valids[valid];

      switch(valid) {
        case 'required': 
          if(!isPreventRequired && value === '') {
            validObj.isValid = false;
            validObj.validType = valid;
            validObj.validMsg = _options.msg[valid] ? _options.msg[valid] : '메시지 미적용';
          }
        break;
        // input type = text
        case 'email':
        case 'password':
          if(!validReg.test(value)) {
            validObj.isValid = false;
            validObj.validType = valid;
            validObj.validMsg = _options.msg[valid] ? _options.msg[valid] : '메시지 미적용';
          }
        break;
        case 'min':
        break;
        case 'max':
        break;
        // select
        // case 'select': 
      }

      if(!validObj.isValid) {
        return validObj;
      }
    });

    return validObj;
  }

  var init = function(form, newOptions) {
    // form target 설정
    // form의 type이 어떻게 되는지 확인 후 formEl에 할당
    getFormEl(form);

    // option 합치기
    extendOpts(options, newOptions);

    console.log(options);
    // data-valid 속성을 가지고 있는 태그들만 찾아 루프를 돌림.
    // data-valid 속성을 가지고 있는 태그를 찾는다.
    // 찾은 태그의 data-valid 값을 수집한다. 
    // - 그 값은 여러개의 값이 들어 올 수 있음. 
    // - 배열로 수집
    setCheckTagInfos();

    // 이벤트 할당
    // target: text, select
    // text: keyup
    // select: ???
    bindEvent();

    // summit 버튼 찾기 
    // 기본적으로 submit 버튼을 찾도록 만들고 만약 없으면 메서드를 통해 추가하도록 만들자
    setSubmitBtnEl();

    // submitBtnEl
    submitBtnEl.addEventListener('click', function(e) {
      /*
        required와 valid를 따로 검사해야함.
        1. required와 valid의 우선순위 
          1) required
          2) valid
        2. 중복된 valid가 있는경우 고려
          ex) required, number, max, min인 경우
        3. realTime에도 적용될 수 있도록 재사용성 고려
      */
      e.preventDefault();

      var invalidTagInfos = [];

      checkTagInfos.forEach(function(tagInfo) {
        var checkedTagInfo = checkValid(tagInfo.el, false);
        
        if(!checkedTagInfo.isValid) {
          invalidTagInfos.push({
            el: tagInfo.el,
            msg: checkedTagInfo.validMsg
          });
        }
      });

      if(invalidTagInfos.length > 0) {
        console.log(invalidTagInfos);
      } else {
        this.submit();
      }
    });
  }
  return {
    init: init
  };

})());