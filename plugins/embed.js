const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require("discord.js");

module.exports = (color) => {
  class EmbedV2 extends ContainerBuilder {
    constructor() {
      super();
      this._color = color;
    }
    title(text) {
      this.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${text}`)
      );
      this.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      return this;
    }
    desc(text) {
      this.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(text)
      );
      return this;
    }
    thumb(url) {
      this.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(url)
        )
      );
      return this;
    }
    img(url) {
      this.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(url)
        )
      );
      return this;
    }
    setColor() { return this; }
    setDescription(text) { return this.desc(text); }
    setTitle(text) { return this.title(text); }
    setImage(url) { return this.img(url); }
    setThumbnail(url) { return this.thumb(url); }
    setFooter() { return this; }
    setAuthor() { return this; }
    setTimestamp() { return this; }
    setURL() { return this; }
    addFields() { return this; }
  }
  return EmbedV2;
};
