( function ( $ ) {
    "use strict";

    // -- globals

    var shearchVieuw = $("#recherche");
    var seriesVieuw = $("#mesSeries");
    var sId,
    erreur = $("p.erreur"),
    oGabLien,
    aSaveSerie = [];

    // -- methods
        
    // on change la vue et on créer l'historique de navigation
        
    var changeVieuw = function( e ) {
          
        e.preventDefault();
          
        if($(this).parent().hasClass("actif")){
            return;
        }
          
        sId = $(this).attr("rel");
            
        history.pushState({
            id: sId
        },$('div#'+sId).find('h3').text(),sId +".html");
            
        window.onpopstate = historyHasChanged;
        
        switchVieuw(sId);          
    };
        
    var historyHasChanged = function( e ) {        
        switchTab(e.state != null ? e.state.id : "Serie");        
    };
         
    var switchVieuw = function( sId ) {          
        $("li.actif , div.vieuw.actif").removeClass("actif");
        $('a[rel="'+sId+'"]').parent().addClass("actif");
        $("#" + sId).addClass("actif");   
    };
        
    //  on cherche une/les serie(s) correspondant au mot(s) clef(s)
        
    var shearchSerie = function( e ) {
            
        var sNom = shearchVieuw.find('input').val();
            
        $.ajax({
            url:'http://api.betaseries.com/shows/search.json?title='+sNom+'&key=8e3315b976be',
            dataType:'jsonp',
            success: searchSuccess
        });
            
    };
        
    //  on affiche les résultats si il y'en a après verification d'erreur
        
    var searchSuccess = function( oData ) {
            
        var i, oResultats, oCurrentLink;
            
        console.log(oData.root);
            
        shearchVieuw.find('a').remove();
            
        if(oData.root.errors == 0) {
                
            erreur.slideUp();
                
            if(oData.root.shows != 0) {
                   
                shearchVieuw.find('p').first().slideUp();
                
                //  pour chaque resultat on clone le gabarit du lien, on lui donne un titre et l'url ainsi qu'un ecouteur d'evenement
                
                if(shearchVieuw.find("li")){
                    shearchVieuw.find('li').remove();
                }
                
                for ( i=-1; oResultats = oData.root.shows[++i];) {
                    
                    oCurrentLink = oGabLien.clone();
                    
                    oCurrentLink.attr('id', oResultats.url);
                    
                    oCurrentLink.find("a").attr({
                        rel: oResultats.url,
                        title : oResultats.title
                    }).text(oResultats.title);
                    oCurrentLink.appendTo(shearchVieuw.find("ul")).on('click', recupInfoSerie);;
                    
                } 
                
            }
            else {
                shearchVieuw.find('li').remove();
                shearchVieuw.find('div').remove();
                shearchVieuw.find('p').first().show().slideDown();
            }                
                
        }
        else {
            console.log(oData.root.errors.error);
            erreur.show().slideDown();
        }
    };
    
    //  on recupere les informations de la série
    
    var recupInfoSerie = function( e ) {
        
        var sUrl;
        
        e.preventDefault();
        
        sUrl = $(this).find('a').attr("rel");
        
        $.ajax({
            url:'http://api.betaseries.com/shows/display/'+sUrl+'.json?key=8e3315b976be',
            dataType:'jsonp',
            success: afficheInfoSerie
        });
        
    };
    
    // on affiche les informations de la série
    
    var afficheInfoSerie = function( oData ) {
        
        var oInfoSup, sUrl, sDuree, sDescri, sImg, sStatus, sTitre, sChaine, sStatusFr, i, u, iNbSaison, iNbEpisodes = 0, oAjoutLink, sTxt;
        console.log(oData);
        
        sUrl = oData.root.show.url;
        sDuree = oData.root.show.duration;
        sDescri = oData.root.show.description;
        sImg = oData.root.show.banner;
        sChaine = oData.root.show.network;
        sTitre = oData.root.show.title;
        sStatus = oData.root.show.status;
        
        if(shearchVieuw.find('div')) {
            shearchVieuw.find('div').remove();
            shearchVieuw.find('#ajouter').remove();
        }
        
        if(shearchVieuw.find('p.success')){
            shearchVieuw.find('p.success').slideUp().remove();
        }
        
        if(sStatus == 'Ended'){
            sStatusFr = 'Fini';
        }else{
            sStatusFr = 'En cours';
        }
        
        for( i=1; i > 0; i++){
            if(oData.root.show.seasons[i]) {
                iNbSaison = i;
                iNbEpisodes = iNbEpisodes + oData.root.show.seasons[i].episodes;
                
                // on creer un tableau pour les épisodes qui est associer a la saison.
                // on boucle sur le nombre d'épisode total et on incremente le tableau avec le numero de l'episode
                
                aSaveSerie[i] = [];
                for (u = 1; u <= oData.root.show.seasons[i].episodes; u++){
                    aSaveSerie[i][u] = false;
                }
            }
            else{
                i = -1;
            }
        }

        // affiche le bouton d'ajout'
        
        oAjoutLink = $('<a></a>').attr('href', 'javascript:void(0);').attr({
            rel: sUrl,
            title: sTitre,
            id: 'ajouter'
        }).text('Ajouter à mes séries');
        
        // affiche la description et les autres informations
        
        oInfoSup = $('<div></div>').attr('class','infoSerie');

        oInfoSup.insertAfter($('#' + sUrl)).slideUp(function(){
            $(this).slideDown().on('click', effaceInfoSerie);
            oAjoutLink.insertAfter($('#' + sUrl)).on('click', ajouterSerie);
        });

        $("<img />").attr({
            src: sImg, 
            width: 290, 
            height: 69, 
            title: sTitre, 
            alt: sTitre
        }).appendTo(oInfoSup);

        if(iNbSaison > 1){
            sTxt = ' saisons';
        }else{
            sTxt = ' saison';
        }

        $('<p></p>').text(iNbSaison + sTxt + ' - '+ iNbEpisodes + ' épisodes - '+sDuree+' min - '+ sStatusFr).appendTo(oInfoSup);
        $('<p></p>').attr('class', 'chaine').text('Diffusé sur ' + sChaine).appendTo(oInfoSup);
        $('<p></p>').text(sDescri).appendTo(oInfoSup);

    };
    
    var effaceInfoSerie = function( e ) {
        
        $(this).slideUp(function(){
            
            $(this).remove();
            $('#ajouter').remove();
            
        });
        
    };
    
    var ajouterSerie = function( e ) {
      
        var sTitre, sUrl, sKey, oSave;
        
        $(this).slideUp( function( e ){
            $(this).remove();
            $('<p></p>').text('La série a été ajoutée').attr('class', 'success').insertAfter($('.infoSerie'));
            $('.infoSerie').slideUp(function( e ) {                
                $(this).remove();                
            }); 
        });    
      
        sTitre = $(this).attr('title');
        sUrl = $(this).attr('rel');
      
        sKey = 'serie_'+ sUrl;

        oSave = {
            'Titre' : sTitre, 
            'Url' : sUrl,
            'Saison' : aSaveSerie
        };

        window.localStorage.setItem(sKey, JSON.stringify(oSave));

        console.log(window.localStorage);
      
    };
    
    // recupere les infos du localStorage
    
    var recupSave = function() {
        
        var sKey, i = 0, aSerie = [];

        for(sKey in localStorage){
            if(sKey.substring(0,6) =="serie_"){
                aSerie[i] = JSON.parse(window.localStorage.getItem(sKey));
            }
            i++;
        }
        return aSerie;
    };
    
    var showMySeries = function( e ) {
        
        var aSerie = [], i, u, oContent;
        
        if(window.localStorage.length !== ""){
            
            if(seriesVieuw.find('div')){
                seriesVieuw.find('div').remove();
            }
            
            aSerie = recupSave();
        
            for(i = 0; i < aSerie.length; i++ ){
                oContent = $('<div></div>').attr('id', aSerie[i].Url).appendTo(seriesVieuw);
                
                $('<h3></h3>').text(aSerie[i].Titre).appendTo(oContent);
                
                $('<a></a>').attr('href', 'javascript:void(0);').attr({
                    rel : aSerie[i].Url,
                    title : 'Retirer cette série de ma liste'
                }).attr('class', 'supprimer').text('supprimer').appendTo(oContent).on('click', deletedSerie);
                
                for( u = 1; u < aSerie[i].Saison.length; u++){
                    $('<a></a>').attr('href', 'javascript:void(0);').attr({
                        name : u,
                        title : 'voir les épisodes de cette saison',
                        rel : aSerie[i].Url
                    }).attr('class', 'fermer').text('Saison ' + u).appendTo(oContent).on('click', showEpisode);
                }            
            }                
        }
        else{
            seriesVieuw.find('p').slideDown();
        }
        
    };
    
    var deletedSerie = function( e ) {
        
        e.preventDefault();
        
        var sUrl = $(this).attr('rel'),
        sKey = 'serie_' + sUrl;
            
        $('#'+sUrl).slideUp(function(){
            $('#'+sUrl).remove();
        });
        
        console.log(sUrl);
        
        window.localStorage.removeItem(sKey);    
            
        console.log(localStorage);
        
        if(window.localStorage.length==""){
            seriesVieuw.find('p').slideDown();	
        }
        
    }
    
    var showEpisode = function( e ) {
      
        e.preventDefault();
      
        var aSerie = [], sUrl , i, u, oContent, sNumSaison, sStatus, oContentEp;
        
        sUrl = $(this).attr('rel');
        sNumSaison = $(this).attr('name');
        sStatus = $(this).attr('class');        
        
        if(sStatus == 'fermer'){
            
            aSerie = recupSave();
            
            oContent = $('<ul></ul>').attr('class', sUrl).insertAfter('a[rel='+sUrl+'][ name='+ sNumSaison+']');
            
            for(i = 0; i < aSerie.length; i++ ) {
                if(aSerie[i].Url == sUrl){
                    
                    for(u = 1; u < aSerie[i].Saison[sNumSaison].length; u++) {
                        oContentEp = $('<li></li>').attr({
                            // i = position dans le tableau, sNumSaison est le num de la saison, u = num de l'episode
                            name : i+'-'+sNumSaison+'-'+u,
                            alt : sUrl
                        }).text('Épisode n°'+u).on('click',updateEpisodeVieuw);
                        
                        if(aSerie[i].Saison[sNumSaison][u] == false){
                            oContentEp.attr('class', 'non-vu').appendTo(oContent);
                        }
                        else {
                            oContentEp.attr('class', 'vu').appendTo(oContent);
                        }
                    }                    
                }                
            }            
            $(this).attr('class', 'ouvert');
        }else{
            
            seriesVieuw.find('.'+sUrl).slideUp(function( e ) {
                $(this).remove();
            });
            
            $(this).attr('class', 'fermer');
        }
          
    };
    
    var updateEpisodeVieuw = function( e ) {
        
        var aSerie = [], sUrl, sInfoEpisode, sStatus, sKey;
        
        aSerie = recupSave();         
        sUrl = $(this).attr('alt');
        sInfoEpisode = $(this).attr('name').split('-');
        sStatus = $(this).attr('class');
        sKey = 'serie_'+sUrl;
        
        if(aSerie[sInfoEpisode[0]].Url == sUrl) {
            if( sStatus == 'non-vu'){
                aSerie[sInfoEpisode[0]].Saison[sInfoEpisode[1]][sInfoEpisode[2]] = true;
                window.localStorage.setItem(sKey, JSON.stringify(aSerie[sInfoEpisode[0]]));
                $(this).attr('class', 'vu');
            }
            else {
                aSerie[sInfoEpisode[0]].Saison[sInfoEpisode[1]][sInfoEpisode[2]] = false;
                window.localStorage.setItem(sKey, JSON.stringify(aSerie[sInfoEpisode[0]]));
                $(this).attr('class', 'non-vu');
            }
        }        
    };
    
    var resetShearch = function( e ) {
        shearchVieuw.find('input').val('');
        shearchVieuw.find('li').remove();
        shearchVieuw.find('.success').remove()
    };
    
    var getPlanning = function( e ) {
        
        $.ajax({
            url:'http://api.betaseries.com//planning/general.json?key=8e3315b976be',
            dataType:'jsonp',
            success: showPlanning
        });        
    };
    
    var showPlanning = function( oData ) {
      
        var aSerie, oContent, i, u, sDate, sUl;
      
        aSerie = recupSave();
        $('#planning').find('div').remove();
        
        for(i = 0; i < aSerie.length; i++) {            
            for(u = 0; u < oData.root.planning.length; u++) {
                if(oData.root.planning[u].url == aSerie[i].Url) {                    
                    sDate = new Date(oData.root.planning[u].date*1000); 
                    oContent = $('<div></div>').appendTo('#planning');
                    $('<h3></h3>').text(aSerie[i].Titre).appendTo(oContent);
                    sUl = $('<ul></ul>').appendTo(oContent);
                    $('<li></li>').text(sDate.toLocaleDateString()).appendTo(sUl);
                    $('<li></li>').text('Saison : '+ oData.root.planning[u].season +' Épisode : ' + oData.root.planning[u].episode).appendTo(sUl);
                    $('<li></li>').text(oData.root.planning[u].title).appendTo(sUl);
                    console.log(oData.root.planning[u]);                    
                }
            }            
        }        
    };

    $( function () {

        // -- onload routines
        
        // on cache les messages pour informer d'une erreur
               
        erreur.hide();
        
        shearchVieuw.find('p').first().hide();
        
        seriesVieuw.find('p').first().slideUp();
        
        // recupere le gabarit des liens
        
        oGabLien = shearchVieuw.find("li").first().remove();
        
        // on change les vues et créer l'historique
               
        $("#menu a ").on("click",changeVieuw);
        
        // on recupere l'evenement recherche
        
        shearchVieuw.find("form").on("submit", shearchSerie);
        
        $('a[rel=serie]').on('click', showMySeries);
        
        $('a[rel=recherche]').on('click', resetShearch);
        
        $('a[rel=planning]').on('click', getPlanning);

    } );

}( jQuery ) );
