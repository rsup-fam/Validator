;(function($) {

  function Validator(target, options) {

    // if(this instanceof Validator) {
    //   return new Validator(target, options);
    // }


    /**
     *
     * 정적인 변수들
     * 1. validTypes 유효성 검사 정규식
     * 2. defaultOptions
     *    - validatorCss : error 메시지 스타일
     *    - messages: error 메시지
     * 3. findTags: 찾을 태그 모음
     * 4. $target: form 태그
     */

    this.defaultOptions = {
      validatorCss: {
        color: '#f00'
      },
      messages: {
        email: '이메일을 잘못 입력하셨습니다.',
        password: '비밀번호를 잘못 입력하셨습니다.',
        conference: '회의 시간이 가능한 범위가 아닙니다.',
        phone: '전화번호를 잘못 입력하셨습니다.',
        select: '필수 선택란입니다.',
        required: '필수 입력란입니다.',
        xss: '보안',
      },
      regex: {
        email: /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
        phone: /^[0-9|-]*$/,
        password: /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,16}$/,
        conference: /^(10|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])$/g
      },
      submitBtn: undefined
    };
    this.findTags = ['input', 'select'];
    this.$target = undefined;

    // this.setValidTypes = function(key, value) {
    //   this.validTypes[key] = value;
    // }

    // this.getFindTags = function() {
    //   return findTags.join(' ');
    // }

    // this.addFindTags = function() {
    //   this.findTags
    // }

    // this.showValidatorInfos = function() {

    //   return {
    //     options: $(this.defaultOptions).clone(true),
    //     findTags: $(findTags).clone(true),
    //     target: $(target)
    //   }
    // }


    /**
     *
     * init
     *
     * 해당 form태그의 findTags들에 validator를 적용시켜주는 함수.
     *
     */


    this.init = function(target, options) {

      // validTypes, defaultOptions, findTags 는 this로 

      this.$target = $(target);

      var defaultOptions = this.defaultOptions;
      var findTags = this.findTags;
      var regex = this.defaultOptions.regex;
      var validTagsInfo = {};
      var $submitBtn;


      // 처음 생성자의 매개변수중 target이 string selector 일 때 
      // (추후 element로 받을 때도 적용되게 끔 추가) 
      if(typeof target === 'string') {
        $target = $(target);
      }

      // defaultOptions에 생성자의 매개변수로 받은 options와 합쳐주는 역할.
      if(typeof options !== undefined) {

        defaultOptions = this.defaultOptions = $.extend(true, this.defaultOptions, options);
      }



      // submit 버튼이 있으면 그걸 사용하고 아니면 options에서 받은 걸 사용.
      $submitBtn = $target.find('[type="submit"]').length > 0
        ? $target.find('[type="submit"]')
        : typeof defaultOptions.submitBtn === 'string'
          ? $target.find(defaultOptions.submitBtn)
          : defaultOption.submitBtn;

      // target이 formTag인지 확인
      // if(!$target.is('form')) {
      //   console.log('target: ', $target);
      //   console.log('is form: ', $target.is('form'));
      //   console.warn('form 객체 필요');
      //   return;
      // }

      // 모든 input 태그에 XSS 적용
      $target.keyup(function(e) {
        var $target = $(e.target);
        var hasValidAttr = (typeof $(e.target).attr('data-valid') !== 'undefined') ? true : false;

        if($target.is('input[type="text"]') && !hasValidAttr && checkXSS($target)) {
          return;
        }
      })

      // form태그 안에 있는 태그를 찾는다.
      for(var i = 0, len_i = findTags.length; i < len_i; i++) {
        var findTag = findTags[i];
        var foundTags = $target.find(findTag + '[data-valid]');

        // validTagsInfo는 data-valid 속성을 가지고 있는 태그들의 정보를 받아 놓을 객체
        validTagsInfo[findTag] = {info: []};

        // data-valid 속성을 가지고 있는 태그들만 찾아 루프를 돌림.
        for(var j = 0, len_j = foundTags.length; j < len_j; j++) {
          var foundTag = $(foundTags[j]);
          var attrName = foundTag.attr('name');
          var valids = foundTag.attr('data-valid');
          var tempObj = {
            valids: '',
            $el: undefined
          };

          // console.log('foundTag: ', foundTag);
          valids = valids.split(' ');
          // if(JSON.stringify(foundTag) !== '{}') {
          // } else {
          //   continue;
          // }

          // errorTemplate을 태그의 형제로 추가
          setErrorTemplate(foundTag, attrName);
          // 태그에 event를 바인딩 시켜 줌.
          bindEvent(foundTag, valids);

          tempObj.valids = valids;
          tempObj.$el = foundTag;

          // valids(data-valid="[이 안에 있는 값을 배열로 바꿔서 추가]"), $el(jQuery 객체)를 태그이름가진 키값의 info[배열]에 push
          validTagsInfo[findTag].info.push(tempObj);
        }

      }

      console.log('validTagsInfo: ', validTagsInfo)
      // setSubmitEvent();
      $submitBtn.click(setSubmitEvent);

      /**
       * @func bindEvent
       * @param {jQueryEl} $target
       * @param {Array} valids
       * @description validator를 사용할 태그에 이벤트를 바인딩하는 함수.
       */
      function bindEvent($target, valids) {
        if(valids.indexOf('phone') >= 0) {
          bindkeyUpEvent($target, regex.phone, defaultOptions.messages.phone);
          return;
        }
        if(valids.indexOf('email') >= 0) {
          bindkeyUpEvent($target, regex.email, defaultOptions.messages.email);
          return;
        }
        if(valids.indexOf('password') >= 0) {
          bindkeyUpEvent($target, regex.password, defaultOptions.messages.password);
          return;
        }

        bindkeyUpEvent($target);
      }

      /**
       * @func checkXSS
       * @param {jQueryEl} $target
       * @description XSS 보안 체크하는 함수.
       */
      function checkXSS($target) {
        var value = $target.val();
        var regex = /[\/:?*<>"|&\\%+;']/;

        if(regex.test(value)) {
          value = value.replace(/[\/:?*<>"|&\\%+;']/gi,'');
          alert(defaultOptions.messages.xss);
          $target.val(value);

          return true;
        }

        return false;
      }
      /**
       * @func bindkeyUpEvent
       * @param {jQueryEl} $target
       * @param {RegExp} regex
       * @param {String} msg
       * @description input 태그에 이벤트를 바인딩하는 함수.
       */
      function bindkeyUpEvent($target, regex, msg) {

        msg = msg || defaultOptions.messages.required;

        $target.keyup(function(e) {

          var $target = $(e.target);
          var value = $target.val();
          var $messageObj = $(this).parent().find('.error');

          if(checkXSS($target)) {
            return;
          }
          // console.log('text evt $messageObj', $messageObj);

          // if(value.trim().length === 0) {
          //   $messageObj.html(defaultOptions.messages.required);
          //   return;
          // }
          // console.log('regex: ', typeof regex);
          // if(typeof regex !== 'undefined') {
          //   if(!regex.test(value)) {
          //     // message에 추가하기
          //     $messageObj.html(msg);
          //     return;
          //   } 
          // }

          // $messageObj.html('');

        });
      }
      /**
       * @func setSubmitEvent
       * @description submit을 수행하는 함수.
       */
      function setSubmitEvent() {
        // 1.required가 있는 태그만 선별
        var requiredTags = findHaveValidTags(validTagsInfo);
        var invalidTags = [];

        console.log('requiredTags: ', requiredTags);
        // 2. valid에 충족하는지 검사. 충족하지 않으면 invalidTags에 넣기
        //   - $el: jQuery element
        //   - msg: required or required이외의 inValid 메시지
        for(var i = 0, len = requiredTags.length; i < len; i++) {
          var requiredTag = requiredTags[i];
          var $el = requiredTag.$el;

          var valids = requiredTag.valids;
          var regexInfo, regex, valid;
          var hasRequired = valids.indexOf('required') > -1 ? true : false;

          console.log('valids: ', valids);

          findElement($el, '.error').html('');

          regexInfo = getValidRegex(valids);
          regex = regexInfo.regex;
          valid = regexInfo.valid;



          if($el.is('input')) {
            var value = $el.val();
            // input의 value값이 비어있을 때
            console.log('$el: ', $el);
            console.log('hasRequired', hasRequired);
            console.log('value.trim().length: ', value.trim().length);
            if(hasRequired) {

              if(value.trim().length === 0) {
                console.log('invalid Tag: '. $el);
                invalidTags.push({
                  $el: $el,
                  msg: defaultOptions.messages['required'] ? defaultOptions.messages['required'] : '메시지 미지정'
                });
                continue;
              }
            }

            if(!regex.test(value)) {
              console.log('????????????????????? valid', defaultOptions.messages[valid]);
              invalidTags.push({
                $el: $el,
                msg: defaultOptions.messages[valid] ? defaultOptions.messages[valid] : '메시지 미지정'
              });
              continue;
            }

          }
          if($el.is('select')) {
            console.log('valids.length = 1, select');
            var $option = $el.find('option:selected');
            var text = $option.val();

            // /선택하세요/
            if(hasRequired && text.trim().length === 0) {
              invalidTags.push({
                $el: $el,
                msg: defaultOptions.messages[valid] ? defaultOptions.messages[valid] : '메시지 미지정'
              });
            }
            continue;
          }

          if ($el.attr('id') === 'conferenceWatingMaxMinutes') {
            var regNumber = /^[0-9]*$/;
            var maxWatingTime = $.trim($('#conferenceWatingMaxMinutes').val());
            console.log('+++++1인회의 최대', maxWatingTime);

            // 1인 최대 대기시간 유효성체크
            if (!regNumber.test(maxWatingTime)) {
              invalidTags.push({
                $el: $el,
                msg: $.i18n.RM00455
              });
            } else if (10 > Number(maxWatingTime)) {
              invalidTags.push({
                $el: $el,
                msg: $.i18n.RMA01096
              });
            } else if ( Number(maxWatingTime) > 30) {console.log('+++여기', $.i18n.RMA01097);
              invalidTags.push({
                $el: $el,
                msg: $.i18n.RMA01097
              });
              console.log('++++invalidTags1', invalidTags);
            }
          }
        }

        console.log('++++invalidTags2', invalidTags);

        // 취합한 invalid 정보들이 존재하면 에러메시지와 포커싱을 주고 아니면 submit을 진행
        if(invalidTags.length > 0) {

          for(var i = 0, len = invalidTags.length; i < len; i++) {
            var $invalidTag = invalidTags[i].$el;
            var errorMsg = invalidTags[i].msg;
            console.log('$invalidTag: ', $invalidTag);
            // var $errorMsgTag = $invalidTag.parent().find('.error');
            var $errorMsgTag = findElement($invalidTag, '.error');

            $errorMsgTag.html(errorMsg);

            if(i === 0) {
              $invalidTag.focus();
            }

          }
          console.log('invalidTags: ', invalidTags);
        } else {
          $target.submit();
        }
        // 

      }


      /**
       * @func getValidRegex
       * @param {Array} valids
       * @description required를 제외한 valid를 찾아 반환하는 함수.
       */
      function getValidRegex(valids) {

        var pattern = '';
        var flags = '';
        var resultValid = 'required';
        var resultRegex;

        for(var i = 0, len = valids.length; i < len; i++) {
          var valid = valids[i];
          var _regex = '';

          if(valid === 'required') {
            continue;
          }

          console.log('valid: ', valid);
          console.log('regex[valid]: ', regex[valid]);

          _regex = regex[valid].toString().split('\\/').join('').split('/');

          console.log('============_regex', _regex);

          // _regex.split('/')
          pattern = _regex[1];
          flags = _regex[2];
          resultValid = valid;
        }

        if(flags !== '') {
          resultRegex = new RegExp(pattern, flags);
        } else {
          resultRegex = new RegExp(pattern);
        }

        return {
          regex: resultRegex,
          valid: resultValid
        }
      }

      /**
       * @func findHaveValidTags
       * @param {Object} obj validTagsInfo
       * @description required를 가진 태그 정보만 추출해 반환하는 함수.
       */
      function findHaveValidTags(obj) {

        var result = [];

        for(var prop in obj) {
          if(obj.hasOwnProperty(prop)) {
            var propType = Object.prototype.toString.call(obj[prop]).toLowerCase().slice(8, -1);
            if(propType === 'array') {
              var _tempArr = [];
              for(var i = 0, len = obj[prop].length; i < len; i++) {
                // console.log('obj[prop].valids: ', obj[prop]);
                // var isRequiredTag = (obj[prop][i].valids.indexOf('required') >= 0) ? true : false;

                // if(isRequiredTag) {
                _tempArr.push(obj[prop][i]);
                // }
              }
              result = result.concat(_tempArr);
            } else if(propType === 'object') {
              result = result.concat(findHaveValidTags(obj[prop]));
            }
          }
        }

        return result;
      }


      // template에 inline으로 들어갈 style옵션 적용
      /**
       * @func setErrorTemplate
       * @param {jQueryEl} $target
       * @param {String} attrName
       * @description error 메시지 태그를 추가하는 함수.
       */
      function setErrorTemplate($target, attrName) {

        var messageTemp = $('<span id="' + attrName + '-message" class="error"></span>');
        var $label =  findElement($target, 'label');

        messageTemp.css(defaultOptions.validatorCss);

        $label.append(messageTemp);
      }

      /**
       * @func findElement
       * @param {jQueryEl} $target
       * @param {String} findIt
       * @description 자식에서 부모로 엘리먼트를 찾는 메서드.
       */
      function findElement($target, findIt) {

        var result;

        do {
          $target = $target.parent();
          // console.log('finding: ', $target);
          // console.log('finding: '. $target.find(findit));
        } while($target.find(findIt).length <= 0);

        result = $target.find(findIt);
        return result;
      }

      function setXSSSecurity() {
        var regex = /[\/:?*<>"|&\\%+;']/;

      }

      console.log('validTagsInfo', validTagsInfo);
    }
    // init end

    this.init(target, options);
  }

  Validator.constructor = Validator;

  window.Validator = Validator;

})(window.jQuery)