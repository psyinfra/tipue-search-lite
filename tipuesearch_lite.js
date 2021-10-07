// Tipue Search Lite
// Licensed under the MIT license. See the LICENSE file for details.

// list from http://www.ranks.nl/stopwords
const commonTerms = ["a", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];

// Weighting for tipue KMP algorithm
const tipuesearchWeight = {'weight': [
    {'url': 'http://www.tipue.com', 'score': 60},
    {'url': 'http://www.tipue.com/search', 'score': 60},
    {'url': 'http://www.tipue.com/tipr', 'score': 30},
    {'url': 'http://www.tipue.com/support', 'score': 20}
]};

window.onload = function execute(){
    var set = {
        "contextBuffer": 60,
        "contextLength": 60,
        "contextStart": 90,
        "descriptiveWords": 25,
        "highlightTerms": true,
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

        let historyUrl = '';
        let historyTitle = '';

        let query = document.getElementById("tipue_search_input").value;
        if (!query || query.length === 0) {
            historyUrl = location.href.split('?')[0];
        } else {
            historyUrl = historyUrl + '?q=' + query;
            historyTitle = 'Search - ' + query;
        }

        // add to address bar and history
        history.pushState({}, historyTitle, historyUrl);
        return false;
    };

    function getTipueSearch() {
        const startTimer = new Date().getTime();
        let results = [];
        let resultsHTML = "";

        let searchTerms = parseQuery(document.getElementById("tipue_search_input").value);
        let commonTermHits = commonTerms.filter(item => searchTerms.includes(item));
        searchTerms = searchTerms.filter(item => !commonTermHits.includes(item));
        results = getSearchResults(searchTerms, tipuesearch);

        if (set.showTitleCount) {
            document.title = "(" + results.length + ") " + originalTitle;
        }
        // build HTML for each result
        for (const r of results) {
            resultsHTML += "<div class='tipue_search_result'>";
            resultsHTML += "<div class='tipue_search_content_title'><a href='" + r.url + "'>" + r.title + "</a></div>";
            if (set.showURL) {
                resultsHTML += "<div class='tipue_search_content_url'><a href='" + r.url + "'>" + r.url + "</a></div>";
            }
            // add and modify output (for example display search words in bold)
            if (r.description) {
                let pageText = r.description;
                if (set.showContext) {
                    let posSearchTerm = r.description.toLowerCase().indexOf([... searchTerms][0]);
                    if (posSearchTerm > set.contextStart) {
                        let partialPageText = pageText.substr(posSearchTerm - set.contextBuffer);
                        partialPageText = pageText.substr(posSearchTerm - set.contextBuffer + partialPageText.indexOf(" "));
                        partialPageText = partialPageText.trim();
                        if (partialPageText.length > set.contextLength) {
                            pageText = "... " + partialPageText;
                        }
                    }
                }
                for (const term of searchTerms) {
                    if (set.highlightTerms) {
                        let patr = new RegExp("(" + term + ")", "gi");
                        pageText = pageText.replace(patr, "<h0011>$1<h0012>");
                    }
                }
                partialPageText = "";
                let listOfPageText = pageText.split(" ");
                if (listOfPageText.length < set.descriptiveWords) {
                    partialPageText = pageText;
                } else {
                    partialPageText += listOfPageText.slice(0, set.descriptiveWords).join(" ");
                }
                partialPageText = partialPageText.trim();
                if (partialPageText.charAt(partialPageText.length - 1) != ".") {
                    partialPageText += " ...";
                }
                partialPageText = partialPageText.replace(/h0011/g, "span class=\"tipue_search_content_bold\"");
                partialPageText = partialPageText.replace(/h0012/g, "/span");
                resultsHTML += "<div class='tipue_search_content_text'>" + partialPageText + "</div>";
            }
            if (r.note) {
                resultsHTML += "<div class='tipue_search_note'>" + r.note + "</div>";
            }
            resultsHTML += "</div>";
        }

        // add information to beginning of the output
        resultsHTML = buildResultsInfo(results, startTimer, commonTermHits) + resultsHTML;
        // give the page the actual contents, which were build up
        document.getElementById("tipue_search_content").innerHTML = resultsHTML;
    }

    function buildResultsInfo(results, startTimer, commonTermHits) {
        let resultsInfo = ""
        if (results.length == 1) {
            resultsInfo += "<div id='tipue_search_results_count'>1 result";
        } else {
            resultsInfo += "<div id='tipue_search_results_count'>" + results.length + " results";
        }
        // display search time
        if (set.showTime) {
            const endTimer = new Date().getTime();
            const time = (endTimer - startTimer) / 1000;
            resultsInfo += " (" + time.toFixed(2) + " seconds)";
        }
        resultsInfo += "</div>";
        if (commonTermHits.length > 0) {
            resultsInfo += "<div id='tipue_ignored_words'>Common words \"" + commonTermHits.join(", ") + "\" got ignored.</div>";
        }
        return resultsInfo;
   }
}

    function getSearchResults(searchTerms, tipueIndex) {
        let results = [];

        for (const page of tipueIndex.pages) {
            let score = 0;
            score = tipue_KMP(searchTerms, page);

            if (score != 0) {
                results.push({
                    "score": score,
                    "title": page.title,
                    "description": page.text,
                    "url": page.url,
                    "note": page.note
                });
            }
        }

        results.sort(function(a, b) { return b.score - a.score });
        return results;
    }

    function parseQuery(query) {
        let searchTerms = [];

        while (query.length > 0) {
            query = query.trim();
            if (query.charAt(0) == '"' && query.includes('"', 1)) {
                end = query.indexOf('"', 1);
                searchTerms.push(query.slice(1, end));
                query = query.slice(end + 1);
            } else if (query.charAt(0) == "'" && query.includes("'", 1)) {
                end = query.indexOf("'", 1);
                searchTerms.push(query.slice(1, end));
                query = query.slice(end + 1);
            } else if (query.includes(" ", 1)) {
                end = query.indexOf(" ", 1);
                searchTerms.push(query.slice(0, end));
                query = query.slice(end + 1);
            } else {
                searchTerms.push(query);
                query = '';
            }
        }

        searchTerms = searchTerms.filter(item => (item));
        // remove duplicates
        searchTerms = [...new Set(searchTerms)];
        return searchTerms;
    }

    // -------------------- SEARCH ALGORITHM ------------------------
    function KMP_prefix(pattern, pattern_len) {
        // length of found prefix
        let prefix_len = -1;

        // Start value is always -1
        let prefix_table = [];
        prefix_table.push(prefix_len);

        for (let position_in_pattern = 0; position_in_pattern < pattern_len; position_in_pattern++) {
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
        let position_in_pattern = 0;
        let cnt = 0;
        let pattern_len = pattern.length;

        for (let position_in_text = 0; position_in_text < text.length; position_in_text++) {
            // move pattern until text and pattern match
            while (position_in_pattern >= 0 && text[position_in_text].toLowerCase() !== pattern[position_in_pattern].toLowerCase()) {
                // use prefix-table
                position_in_pattern = prefix_table[position_in_pattern];
            }

            position_in_pattern = position_in_pattern + 1;

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

    function tipue_KMP(searchTerms, page) {
        let score = 0;
        for (let f = 0; f < searchTerms.length; f++) {
            let searchWord = searchTerms[f].toLowerCase();
            let pre_tab = KMP_prefix(searchWord, searchWord.length);
            let match_cnt = KMP_search(searchWord, pre_tab, page.title);
            if (match_cnt != 0) {
                score += (20 * match_cnt);
            }
            match_cnt = KMP_search(searchWord, pre_tab, page.text);
            if (match_cnt != 0) {
                score += (20 * match_cnt);
            }

            if (page.tags) {
                match_cnt = KMP_search(searchWord, pre_tab, page.tags);
                if (match_cnt != 0) {
                    score += (10 * match_cnt);
                }
            }
            match_cnt = KMP_search(searchWord, pre_tab, page.url);
            if (match_cnt != 0) {
                score += 20;
            }
            if (score != 0) {
                for (let e = 0; e < tipuesearchWeight.weight.length; e++) {
                    if (page.url == tipuesearchWeight.weight[e].url) {
                        score += tipuesearchWeight.weight[e].score;
                    }
                }
            }
            if (searchWord.match("^-")) {
                pat=new RegExp(searchWord.substring(1),"i");
                if (KMP_search(searchWord, pre_tab, page.title) != 0 ||
                    KMP_search(searchWord, pre_tab, page.text) != 0 ||
                    KMP_search(searchWord, pre_tab, page.tags)!=0) {
                        score=0;
                }
            }
        }
        return score;
    }
