SacredGrove = class SacredGrove extends Card {

  types() {
    return ['action', 'fate']
  }

  coin_cost() {
    return 5
  }

  play(game, player_cards) {
    game.turn.buys += 1
    let gained_coins = CoinGainer.gain(game, player_cards, 3)
    game.log.push(`&nbsp;&nbsp;<strong>${player_cards.username}</strong> gets +1 buy and +$${gained_coins}`)

    let boon_receiver = new EffectReceiver(game, player_cards, 'boon')
    let boon = boon_receiver.receive()

    if (!_.includes(['The Fields Gift', 'The Forests Gift'], boon.name)) {
      GameModel.update(game._id, game)
      let ordered_player_cards = TurnOrderedPlayerCardsQuery.turn_ordered_player_cards(game, player_cards)
      ordered_player_cards.shift()
      _.each(ordered_player_cards, function(other_player_cards) {
        if (_.size(other_player_cards.hand) > 0) {
          let turn_event_id = TurnEventModel.insert({
            game_id: game._id,
            player_id: other_player_cards.player_id,
            username: other_player_cards.username,
            type: 'choose_yes_no',
            instructions: `Receive ${CardView.render(boon)}?`,
            minimum: 1,
            maximum: 1
          })
          let turn_event_processor = new TurnEventProcessor(game, other_player_cards, turn_event_id, boon)
          turn_event_processor.process(SacredGrove.receive_boon)
        } else {
          game.log.push(`&nbsp;&nbsp;<strong>${other_player_cards.username}</strong> chooses not to receive ${CardView.render(boon)}`)
        }
        GameModel.update(game._id, game)
        PlayerCardsModel.update(game._id, other_player_cards)
      })
    } else {
      game.log.push(`&nbsp;&nbsp;but nobody else may receive ${CardView.render(boon)} because it gives +$1`)
    }
  }

  static receive_boon(game, player_cards, response, boon) {
    if (response === 'yes') {
      game.log.push(`&nbsp;&nbsp;<strong>${player_cards.username}</strong> receives ${CardView.render(boon)}`)
      boon = ClassCreator.create(boon.name)
      boon.receive(game, player_cards)
    }
  }

}
