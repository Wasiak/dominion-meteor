Ball = class Ball extends Event {

  coin_cost() {
    return 5
  }

  buy(game, player_cards) {
    if (!player_cards.tokens.minus_coin) {
      game.log.push(`&nbsp;&nbsp;<strong>${player_cards.username}</strong> takes their -$1 token`)
      player_cards.tokens.minus_coin = true
    } else {
      game.log.push(`&nbsp;&nbsp;<strong>${player_cards.username}</strong> already has their -$1 token`)
    }

    let all_player_cards = PlayerCardsModel.find(game._id)

    let eligible_cards = _.filter(game.cards, function(card) {
      let coin_cost = CostCalculator.calculate(game, card.top_card, all_player_cards)
      return card.count > 0 && card.top_card.purchasable && coin_cost <= 4 && card.top_card.potion_cost === 0
    })

    if (_.size(eligible_cards) > 0) {
      _.times(2, function() {
        GameModel.update(game._id, game)
        let turn_event_id = TurnEventModel.insert({
          game_id: game._id,
          player_id: player_cards.player_id,
          username: player_cards.username,
          type: 'choose_cards',
          game_cards: true,
          instructions: 'Choose a card to gain:',
          cards: eligible_cards,
          minimum: 1,
          maximum: 1
        })
        let turn_event_processor = new TurnEventProcessor(game, player_cards, turn_event_id)
        turn_event_processor.process(Ball.gain_card)
      })
    } else {
      game.log.push(`&nbsp;&nbsp;but there are no available cards to gain`)
    }
  }

  static gain_card(game, player_cards, selected_cards) {
    let card_gainer = new CardGainer(game, player_cards, 'discard', selected_cards[0].name)
    card_gainer.gain_game_card()
  }
}