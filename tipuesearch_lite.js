/*
Tipue Search Lite 8.0
Copyright (c) 2019 Tipue
Tipue Search Lite is released under the MIT License
*/

//Stop words list from http://www.ranks.nl/stopwords
var tipuesearch_stop_words = ["a", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];

// Weighting for tipue KMP algorithm
var tipuesearch_weight = {'weight': [
     {'url': 'http://www.tipue.com', 'score': 60},
     {'url': 'http://www.tipue.com/search', 'score': 60},
     {'url': 'http://www.tipue.com/tipr', 'score': 30},
     {'url': 'http://www.tipue.com/support', 'score': 20}
]};

// these words get replaced by stem if they are searched (e-mail shows results for email)
var tipuesearch_stem = {'words': [
     {'word': 'e-mail', 'stem': 'email'},
     {'word': 'javascript', 'stem': 'jquery'},
     {'word': 'javascript', 'stem': 'js'}
]};

window.onload = function execute(){
    var set = {
        "contextBuffer": 60,
        "contextLength": 60,
        "contextStart": 90,
        "debug": false,
        "descriptiveWords": 25,
        "highlightTerms": true,
        "minimumLength": 3,
        "newWindow": false,
        "showContext": true,
        "showTime": true,
        "showTitleCount": true,
        "showURL": false,
        "wholeWords": true
    };

	// TODO: possibly better change var above, instead of flag if it is still relevant
    // remember if title gets set (to modify tab-name just once)
    var tabTitleFlag = true

    var tipue_search_w = "";
    if (set.newWindow) {
    	// TODO: this gets never modified, just used two times in a string.
        tipue_search_w = " target='_blank'";
    }
    let params = new URLSearchParams(document.location.search.substring(1));

    // read search box, call search
    if (params.get("q")) {
        document.getElementById("tipue_search_input").value = params.get("q");
        getTipueSearch();
    }

	// add to history
    document.getElementById('tipue_search_input').form.onsubmit = function() {
        getTipueSearch();

        var history_url = '';
        var history_title = '';

        var term = document.getElementById("tipue_search_input").value;
        if (!term || term.length === 0) {
          history_url = location.href.split('?')[0];
        } else {
          history_url = history_url + '?q=' + term;
          history_title = 'Search - ' + term;
        }

        // add to address bar and history
        history.pushState({}, history_title, history_url);

        return false;
    }

    function getTipueSearch() {

		// Timer for showTime
		var startTimer = new Date().getTime();
		// string for html output

        var out = "";
        // if only stop words (common words) get found, prints out "nothing found. Common words get ignored"
        var stopWordsFoundFlag = false;
        // TODO: understand/delete standard: (d.match("^\"") && d.match("\"$")) || (d.match("^'") && d.match("'$")))
        var standard = true;
		// counts amount of results/pages found
        var resultCounter = 0;
        // found saves objects about pages that are found
        var found = [];

        // search word
        var searchBoxInput = document.getElementById("tipue_search_input").value;
        searchBoxInput = searchBoxInput.replace(/\+/g, " ").replace(/\s\s+/g, " ");
        searchBoxInput = searchBoxInput.trim();
        var temp_searchWord = searchBoxInput.toLowerCase();

		// if special break characters get used
        if ((temp_searchWord.match("^\"") && temp_searchWord.match("\"$")) ||
        (temp_searchWord.match("^'") && temp_searchWord.match("'$"))) {
            standard = false;
        }
        var searchWordList = temp_searchWord.split(" ");

		// MODIFY SEARCH WORDS - BLOCK
		// this whole if(standard) deletes the stop words from the search
        if (standard) {
        	// TODO: start with searchWordList, iterate over stop-word and delete them from temporary list
        	// saves temporarly the search words from d_w (if they are not common words)
            temp_searchWord = "";
            // for each word check if it is a stop word (common word)
            for (var i = 0; i < searchWordList.length; i++) {
            	// this is true as long as no common word gets found.
                var a_w = true;
                for (var f = 0; f < tipuesearch_stop_words.length; f++) {
                    if (searchWordList[i] == tipuesearch_stop_words[f]) {
                        a_w = false;
                        // saves if a stop word was found at some point
                        stopWordsFoundFlag = true;
                    }
                }
                // if no stop word, add it to list of search words
                if (a_w) {
                  temp_searchWord += " " + searchWordList[i];
                }
            }
            temp_searchWord = temp_searchWord.trim();
            searchWordList = temp_searchWord.split(" ");
		// TODO: not sure about the else case, seems to depend on d.match(...)
        } else {
            temp_searchWord = temp_searchWord.substring(1, temp_searchWord.length - 1);
        }

		// SEARCH TROUGH PAGES - BLOCK
        // minimal amount of characters searched for
        if (temp_searchWord.length >= set.minimumLength) {
            if (standard) {
                // TODO: d_t is temp var?
                var d_t = temp_searchWord;
                // TODO: EITHER DELETE THIS AND THE REPLACEMENT WORDS, OR MOVE UP TO OTHER BLOCK
                // this loop seems to replace words like e-mail with email. I am not sure, if this big if (standard) is needed, because if nothing to replace, the loop gets ignored anyways?
                for (var i = 0; i < searchWordList.length; i++) {
                    for (var f = 0; f < tipuesearch_stem.words.length; f++) {
                        if (searchWordList[i] == tipuesearch_stem.words[f].word) {
                            d_t = d_t + " " + tipuesearch_stem.words[f].stem;
                        }
                    }
                }
            }
            searchWordList = d_t.split(" ");
            // TOODO: check if right:
            // seems to loop over every single page of the wiki (?), gets the text, calculates score and pushes result to "found"
            for (var i = 0; i < tipuesearch.pages.length; i++) {
                var score = 0;
                // text of current wikitext
                var s_t = tipuesearch.pages[i].text;

	            // this searches for all the search words in the text of the current wikipage
                score = tipue_KMP(searchWordList, s_t, set, i);

				// if the page contains search words, save the title etc
                if (score != 0) {
                    found.push({
                        "score": score,
                        "title": tipuesearch.pages[i].title,
                        "desc": s_t,
                        "url": tipuesearch.pages[i].url,
                        "note": tipuesearch.pages[i].note
                    });
                    // counts findings
                    resultCounter++;
                }
            }

            // building up the web-page that shows the search results
            if (resultCounter != 0) {
            	// add the number of results found to document title (add number to tab-name)
                if (set.showTitleCount && tabTitleFlag) {
                    var title = document.title;
                    document.title = "(" + resultCounter + ") " + title;
                    tabTitleFlag = false;
                }

				// "X results found" output line
                if (resultCounter == 1) {
                    out += "<div id='tipue_search_results_count'>1 result";
                } else {
                    var c_c = resultCounter.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    //TODO: why replace this weird expression, should be just an integer
                    out += "<div id='tipue_search_results_count'>" + c_c + " results";
                }

                // show how long search took
                if (set.showTime) {
                    var endTimer = new Date().getTime();
                    var time = (endTimer - startTimer) / 1000;
                    out += " (" + time.toFixed(2) + " seconds)";
                }
                out += "</div>";

				// sorts "found"-array by score
                found.sort(function(a, b) {
                    return b.score - a.score
                });

                for (var i = 0; i < found.length; i++) {
                    out += "<div class='tipue_search_result'>";
                    out += "<div class='tipue_search_content_title'><a href='" + found[i].url + "'" + tipue_search_w + ">" + found[i].title + "</a></div>";
                    if (set.debug) {
                        out += "<div class='tipue_search_content_debug'>Score: " + found[i].score + "</div>";
                    }
                    if (set.showURL) {
                        out += "<div class='tipue_search_content_url'><a href='" + found[i].url + "'" + tipue_search_w + ">" + found[i].url + "</a></div>";
                    }
                    if (found[i].desc) {
                        var t = found[i].desc;
                        // TODO: searchWordList does not get modified, so it does not need to be set again
                        searchWordList = temp_searchWord.split(" ");
                        if (set.showContext) {
                            var s_1 = found[i].desc.toLowerCase().indexOf(searchWordList[0]);
                            if (s_1 > set.contextStart) {
                                var t_1 = t.substr(s_1 - set.contextBuffer);
                                var s_2 = t_1.indexOf(" ");
                                t_1 = t.substr(s_1 - set.contextBuffer + s_2);
                                t_1 = t_1.trim();
                                if (t_1.length > set.contextLength) {
                                    t = "... " + t_1;
                                }
                            }
                        }
                        if (standard) {
                            for (var f = 0; f < searchWordList.length; f++) {
                                if (set.highlightTerms) {
                                    var patr = new RegExp("(" + searchWordList[f] + ")", "gi");
                                    t = t.replace(patr, "<h0011>$1<h0012>");
                                }
                            }
                        } else if (set.highlightTerms) {
                            var patr = new RegExp("(" + temp_searchWord + ")", "gi");
                            t = t.replace(patr, "<span class=\"tipue_search_content_bold\">$1</span>");
                        }
                        var t_d = "";
                        var t_w = t.split(" ");
                        if (t_w.length < set.descriptiveWords) {
                            t_d = t;
                        } else {
                            for (var f = 0; f < set.descriptiveWords; f++) {
                                t_d += t_w[f] + " ";
                            }
                        }
                        t_d = t_d.trim();
                        if (t_d.charAt(t_d.length - 1) != ".") {
                            t_d += " ...";
                        }
                        t_d = t_d.replace(/h0011/g, "span class=\"tipue_search_content_bold\"");
                        t_d = t_d.replace(/h0012/g, "/span");
                        out += "<div class='tipue_search_content_text'>" + t_d + "</div>";
                    }
                    if (found[i].note) {
                        out += "<div class='tipue_search_note'>" + found[i].note + "</div>";
                    }
                    out += "</div>";
                }
            } else { // if words don't give results
                out += "<div id='tipue_search_error'>Nothing found.</div>";
            }
        } else {
            if (stopWordsFoundFlag) { // for example if search is just "yourself"
                out += "<div id='tipue_search_error'>Nothing found. Common words are largely ignored.</div>";
            } else {
                out += "<div id='tipue_search_error'>Search should be " + set.minimumLength + " or more characters.</div>";
            }
        }
        document.getElementById("tipue_search_content").innerHTML = out;
    }

    // -------------------- SEARCH ALGORITHM ------------------------
    function KMP_prefix(pattern, pattern_len){
        // length of found prefix
        var prefix_len = -1;

        // Start value is always -1
        var prefix_table = [];
        prefix_table.push(prefix_len);

        for (var position_in_pattern = 0; position_in_pattern < pattern_len; position_in_pattern++){
        // if prefix is too long, shorten it
        while (prefix_len >= 0 && pattern[prefix_len] !== pattern[position_in_pattern]){
            prefix_len = prefix_table[prefix_len];
        }

        // at this point prefix_len == -1 or pattern[position_in_pattern] == pattern[prefix_len]
        prefix_len = prefix_len + 1;
        prefix_table.push(prefix_len);
        }
        return prefix_table;
    }


    function KMP_search(pattern, prefix_table, text){
        var position_in_pattern = 0;
        var cnt = 0;
        var pattern_len = pattern.length;

        for (var position_in_text = 0; position_in_text < text.length; position_in_text++){
            // move pattern until text and pattern match
            while (position_in_pattern >= 0 && text[position_in_text].toLowerCase() !== pattern[position_in_pattern].toLowerCase()){
                // use prefix-table
                position_in_pattern = prefix_table[position_in_pattern];
            }

            position_in_pattern = position_in_pattern + 1

            // in case end of pattern is reached
            if (position_in_pattern === pattern_len){
                // register match
                //console.log("Match at position "+ (position_in_text - pattern_len).toString() +".");
                cnt++;
                // move pattern
                position_in_pattern = prefix_table[position_in_pattern];
            }
        }
        return cnt;
    }

    function tipue_KMP(searchWordList, s_text, set, i){
        var score = 0;
        for(var f = 0; f < searchWordList.length; f++){
            var pre_tab = KMP_prefix(searchWordList[f], searchWordList[f].length);
            var match_cnt = KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].title);
            if(match_cnt != 0){
                score += (20 * match_cnt);
            }
            match_cnt = KMP_search(searchWordList[f], pre_tab, s_text);
            if(match_cnt != 0){
                score += (20 * match_cnt);
            }

            if(tipuesearch.pages[i].tags){
                match_cnt = KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].tags);
                if(match_cnt != 0){
                    score += (10 * match_cnt);
                }
            }
            match_cnt = KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].url);
            if(match_cnt != 0){
                score += 20;
            }
            if(score != 0){
                for(var e = 0; e < tipuesearch_weight.weight.length; e++){
                    if(tipuesearch.pages[i].url == tipuesearch_weight.weight[e].url){
                        score += tipuesearch_weight.weight[e].score;
                    }
                }
            }
            if(searchWordList[f].match("^-")){
                pat=new RegExp(searchWordList[f].substring(1),"i");
                if(KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].title) != 0 ||
                   KMP_search(searchWordList[f], pre_tab, s_text) != 0 ||
                   KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].tags)!=0){
                    score=0;
                }
            }
        }
        return score;
    }
};
