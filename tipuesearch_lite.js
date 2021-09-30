/*
Tipue Search Lite 8.0
Copyright (c) 2019 Tipue
Tipue Search Lite is released under the MIT License
*/

// list from http://www.ranks.nl/stopwords
var commonWords = ["a", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];

// Weighting for tipue KMP algorithm
var tipuesearchWeight = {'weight': [
    {'url': 'http://www.tipue.com', 'score': 60},
    {'url': 'http://www.tipue.com/search', 'score': 60},
    {'url': 'http://www.tipue.com/tipr', 'score': 30},
    {'url': 'http://www.tipue.com/support', 'score': 20}
]};


function parseSearchWords(searchWord) {
    var searchWordList = [];
    while (searchWord.length > 0) {
        searchWord = searchWord.trim();
        if (searchWord.charAt(0) == '"' && searchWord.indexOf('"', 1) != -1) {
            end = searchWord.indexOf('"', 1);
            searchWordList.push(searchWord.slice(1, end));
            searchWord = searchWord.slice(end + 1)
        } else if (searchWord.charAt(0) == "'" && searchWord.indexOf("'", 1) != -1) {
            end = searchWord.indexOf("'", 1);
            searchWordList.push(searchWord.slice(1, end));
            searchWord = searchWord.slice(end + 1)
        } else if (searchWord.indexOf(" ", 1) != -1) {
            end = searchWord.indexOf(" ", 1);
            searchWordList.push(searchWord.slice(0, end));
            searchWord = searchWord.slice(end + 1)
        } else {
            searchWordList.push(searchWord);
            searchWord = '';
        }
    }
    while (searchWordList.indexOf("") != -1) {
        searchWordList.splice(searchWordList.indexOf(""), 1);
    }
    return searchWordList;
}


window.onload = function execute(){
    var set = {
        "contextBuffer": 60,
        "contextLength": 60,
        "contextStart": 90,
        "descriptiveWords": 25,
        "highlightTerms": true,
        "minimumLength": 3,
        "showContext": true,
        "showTime": true,
        "showTitleCount": true,
        "showURL": false
    };

    var originalTitle = document.title;
    let params = new URLSearchParams(document.location.search.substring(1));

    // call search (if opened as a link)
    if (params.get("q")) {
        document.getElementById("tipue_search_input").value = params.get("q");
        getTipueSearch();
    }

    // call search via search-box
    document.getElementById('tipue_search_input').form.onsubmit = function() {
        getTipueSearch();

        var historyUrl = '';
        var historyTitle = '';

        var term = document.getElementById("tipue_search_input").value;
        if (!term || term.length === 0) {
            historyUrl = location.href.split('?')[0];
        } else {
            historyUrl = historyUrl + '?q=' + term;
            historyTitle = 'Search - ' + term;
        }

        // add to address bar and history
        history.pushState({}, historyTitle, historyUrl);
        return false;
    }

    function getTipueSearch() {
        var startTimer = new Date().getTime();
        var out = "";
        // save objects about pages that are found
        var found = [];
        // get and modify search words
        var searchWordList = document.getElementById("tipue_search_input").value;
        searchWordList = searchWordList.replace(/\+/g, " ").replace(/\s\s+/g, " ");
        searchWordList = parseSearchWords(searchWordList.toLowerCase());

        // ignore common words in search
        var tempSearchWord = [];
        var commonWordsFound = [];
        for (var i = 0; i < searchWordList.length; i++) {
            if (commonWords.indexOf(searchWordList[i]) == -1) {
                tempSearchWord.push(searchWordList[i]);
            } else {
                commonWordsFound.push(searchWordList[i]);
            }
        }
        searchWordList = tempSearchWord;

        // actual "search" if the search word list is long enough
        if (searchWordList.join().length + commonWordsFound.join().length >= set.minimumLength) {
            // loop over pages and search in text
            for (var i = 0; i < tipuesearch.pages.length; i++) {
                var score = 0;
                // text of current page
                var pageContentString = tipuesearch.pages[i].text;

                // call of search algorithm
                score = tipue_KMP(searchWordList, pageContentString, set, i);

                // if the page contains search words, save the title etc
                if (score != 0) {
                    found.push({
                        "score": score,
                        "title": tipuesearch.pages[i].title,
                        "desc": pageContentString,
                        "url": tipuesearch.pages[i].url,
                        "note": tipuesearch.pages[i].note
                    });
                }
            }

            // build search results HTML
            if (set.showTitleCount) {
                document.title = "(" + found.length + ") " + originalTitle;
            }
            if (found.length == 1) {
                out += "<div id='tipue_search_results_count'>1 result";
            } else {
                out += "<div id='tipue_search_results_count'>" + found.length + " results";
            }
            // display search time
            if (set.showTime) {
                var endTimer = new Date().getTime();
                var time = (endTimer - startTimer) / 1000;
                out += " (" + time.toFixed(2) + " seconds)";
            }
            out += "</div>";
            if (commonWordsFound.length > 0) {
                out += "<div id='tipue_ignored_words'>Common words \"" + commonWordsFound.join(", ") + "\" got ignored.</div>";
            }
            if (found.length != 0) {
                found.sort(function(a, b) {
                    return b.score - a.score
                });

                // add output for each found page
                for (var i = 0; i < found.length; i++) {
                    out += "<div class='tipue_search_result'>";
                    out += "<div class='tipue_search_content_title'><a href='" + found[i].url + "'>" + found[i].title + "</a></div>";
                    if (set.showURL) {
                        out += "<div class='tipue_search_content_url'><a href='" + found[i].url + "'>" + found[i].url + "</a></div>";
                    }
                    // add and modify output (for example display search words in bold)
                    if (found[i].desc) {
                        var t = found[i].desc;
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
                        for (var f = 0; f < searchWordList.length; f++) {
                            if (set.highlightTerms) {
                                var patr = new RegExp("(" + searchWordList[f] + ")", "gi");
                                t = t.replace(patr, "<h0011>$1<h0012>");
                            }
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
            out += "<div id='tipue_search_error'>Search should be " + set.minimumLength + " or more characters.</div>";
        }
        // give the page the actual contents, which were build up
        document.getElementById("tipue_search_content").innerHTML = out;
    }

    // -------------------- SEARCH ALGORITHM ------------------------
    function KMP_prefix(pattern, pattern_len) {
        // length of found prefix
        var prefix_len = -1;

        // Start value is always -1
        var prefix_table = [];
        prefix_table.push(prefix_len);

        for (var position_in_pattern = 0; position_in_pattern < pattern_len; position_in_pattern++) {
            // if prefix is too long, shorten it
            while (prefix_len >= 0 && pattern[prefix_len] !== pattern[position_in_pattern]) {
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

        for (var position_in_text = 0; position_in_text < text.length; position_in_text++) {
            // move pattern until text and pattern match
            while (position_in_pattern >= 0 && text[position_in_text].toLowerCase() !== pattern[position_in_pattern].toLowerCase()) {
                // use prefix-table
                position_in_pattern = prefix_table[position_in_pattern];
            }

            position_in_pattern = position_in_pattern + 1

            // in case end of pattern is reached
            if (position_in_pattern === pattern_len) {
                // register match
                //console.log("Match at position "+ (position_in_text - pattern_len).toString() +".");
                cnt++;
                // move pattern
                position_in_pattern = prefix_table[position_in_pattern];
            }
        }
        return cnt;
    }

    function tipue_KMP(searchWordList, s_text, set, i) {
        var score = 0;
        for (var f = 0; f < searchWordList.length; f++) {
            var pre_tab = KMP_prefix(searchWordList[f], searchWordList[f].length);
            var match_cnt = KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].title);
            if (match_cnt != 0) {
                score += (20 * match_cnt);
            }
            match_cnt = KMP_search(searchWordList[f], pre_tab, s_text);
            if (match_cnt != 0) {
                score += (20 * match_cnt);
            }

            if (tipuesearch.pages[i].tags) {
                match_cnt = KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].tags);
                if (match_cnt != 0) {
                    score += (10 * match_cnt);
                }
            }
            match_cnt = KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].url);
            if (match_cnt != 0) {
                score += 20;
            }
            if (score != 0) {
                for (var e = 0; e < tipuesearchWeight.weight.length; e++) {
                    if (tipuesearch.pages[i].url == tipuesearchWeight.weight[e].url) {
                        score += tipuesearchWeight.weight[e].score;
                    }
                }
            }
            if (searchWordList[f].match("^-")) {
                pat=new RegExp(searchWordList[f].substring(1),"i");
                if (KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].title) != 0 ||
                    KMP_search(searchWordList[f], pre_tab, s_text) != 0 ||
                    KMP_search(searchWordList[f], pre_tab, tipuesearch.pages[i].tags)!=0) {
                        score=0;
                }
            }
        }
        return score;
    }
};
